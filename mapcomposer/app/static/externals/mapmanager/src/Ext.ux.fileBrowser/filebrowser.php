<?
define('DIRECTORY', realpath(dirname(__FILE__)) . '/../examples/demo');
define('WEB_DIRECTORY', '/examples/demo');
define('DEFAULT_PRIVILEGES',0777);
define('NEW_FOLDER_PREFIX','new_');
define('NEW_FOLDER_NAME','folder');
define('THUMBS_FOLDER','.thumbs');
define('THUMBS_WIDTH',100);
define('THUMBS_HEIGHT',100);

$ext_images = array('jpg', 'jpeg', 'gif', 'png');

session_start();
header("Cache-control: private");
//error_reporting(0);

$params = $_REQUEST;

$action = $params['action'];
$folder = $params['folder'];
if  ($folder=='root') {
	$folder='';
}
$path = DIRECTORY . $folder;


function getNewFolderName($folder){
	$folderName = NEW_FOLDER_PREFIX.NEW_FOLDER_NAME;
	$i=1;
	while (is_dir($folder.DIRECTORY_SEPARATOR.$folderName) && i<10){
		$folderName = NEW_FOLDER_PREFIX.$folderName;
		$i++;
	}
	return $folderName;
}

function delFolderTree($folder) {
	$flag = true;
    $files = glob( $folder . '*', GLOB_MARK );
    foreach( $files as $file ){
        if( substr( $file, -1 ) == DIRECTORY_SEPARATOR )
            $flag = $flag && delFolderTree($file);
        else
            $flag = $flag && @unlink($file);
    }
    if (is_dir($folder)) $flag = $flag && @rmdir($folder);
    return $flag;
}
 
function getNoThumb(){
	header ('Content-type: image/png');
	$im = @imagecreate(50, 12);
	$bg = @imagecolorallocate($im, 255, 255, 255);
	$text_color = @imagecolorallocate($im, 128, 128, 128);
	@imagestring($im, 2, 0, 0,  'No thumb', $text_color);
	@imagepng($im);
	@imagedestroy($im);	
}

switch ($action) {
	case "get_folderlist" :
		if ($path && strpos($folder,'.'.DIRECTORY_SEPARATOR)===false) {
			$dirs = glob($path . DIRECTORY_SEPARATOR. '*', GLOB_ONLYDIR);
			$data=array();
			foreach($dirs as $dir){
				$subdirs = glob($dir. DIRECTORY_SEPARATOR. '*', GLOB_ONLYDIR);
				$data[] = array(
					'id' => str_replace(DIRECTORY, "", $dir),
					'text' => substr(strrchr($dir,DIRECTORY_SEPARATOR),1),
					'loaded' => count($subdirs)==0,
					'expanded' => false
				);
			}
			print json_encode($data);
		}
		break;
		
	case "get_filelist" :
		if ($path && strpos($folder,'.'.DIRECTORY_SEPARATOR)===false) {
			$data=array();
			foreach (new DirectoryIterator($path) as $file){
				if($file->isDot() || $file->isDir()) continue;
				if (isset($params['mode']) && $params['mode']=='images'){ 
					$pathinfo = pathinfo($file->getFileName());
					if(!in_array($pathinfo['extension'], $ext_images)){
						continue;
					}
				}
				$item = array(
					'name' => $file->getFileName(),
					'size' => $file->getSize(),
					'mtime' => $file->getMTime(),
					'web_path'=> WEB_DIRECTORY . $folder . DIRECTORY_SEPARATOR . $file->getFileName()
				);
				if (isset($params['mode']) && $params['mode']=='thumbs') {
					$thumb_name = $path . DIRECTORY_SEPARATOR . THUMBS_FOLDER . DIRECTORY_SEPARATOR . $file->getFileName() .'.jpg';
					if (file_exists($thumb_name) && $file->getMTime()<filemtime($thumb_name)) {
						$item['thumb_path'] = str_replace(DIRECTORY,WEB_DIRECTORY,$thumb_name);
					}
				}
				$data[] = $item;
				
			}
			if (count($data)>0) {
				$data['data'] = $data;
				$data['count'] = count($data['data']);
			} else {
				$data['count'] = 0;
				$data['data'] = '';
			}
		}
		print json_encode($data);
		break;
		
	case "folder_new" :
		if ($path && strpos($folder,'.'.DIRECTORY_SEPARATOR)===false) {
			$newFolderName = getNewFolderName($path);
			$newFolderPath = $path.DIRECTORY_SEPARATOR.$newFolderName;
			if (@mkdir($newFolderPath)) {
				@chmod($newFolderPath, DEFAULT_PRIVILEGES);
				print json_encode(array("success"=>true,"folder"=>$folder,'id'=>$folder.DIRECTORY_SEPARATOR.$newFolderName));
			} else {
				print json_encode(array("success"=>false));
			}
		}
		break;
	
	case "folder_rename" :
		if ($path && $params['name'] && strpos($folder,'.'.DIRECTORY_SEPARATOR)===false && $folder!='') {
			$newFolderName = substr($path, 0, strrpos($path, DIRECTORY_SEPARATOR)) . DIRECTORY_SEPARATOR . $params['name'];
			if (@rename($path, $newFolderName)) {
				@chmod($newFolderName, DEFAULT_PRIVILEGES);
				print json_encode(array("success"=>true,"folder"=>$folder,"id"=>str_replace(DIRECTORY,'',$newFolderName)));
			} else {
				print json_encode(array("success"=>false));
			}
		}
		break;
		
	case "folder_delete" :
		if ($path && strpos($folder,'.'.DIRECTORY_SEPARATOR)===false && $folder!='') {
			if (delFolderTree($path)) {
				print json_encode(array("success"=>true,"folder"=>$folder));
			} else {
				print json_encode(array("success"=>false));
			}
		}
		break;
	
	case "file_rename" :
		if ($path && $params['name'] && strpos($folder,'.'.DIRECTORY_SEPARATOR)===false) {
			if (rename($path.DIRECTORY_SEPARATOR.$params['oldName'], $path.DIRECTORY_SEPARATOR.$params['name'])) {
				@chmod($path.DIRECTORY_SEPARATOR.$params['name'], DEFAULT_PRIVILEGES);
				print json_encode(array("success"=>true,"folder"=>$folder,"id"=>$params['name']));
			} else {
				print json_encode(array("success"=>false));
			}
		}
		break;
	
	case "file_delete" :
		if ($path && strpos($folder,'.'.DIRECTORY_SEPARATOR)===false && $params['file']) {
			if (@unlink($path.DIRECTORY_SEPARATOR.$params['file'])) {
				print json_encode(array("success"=>true,"folder"=>$folder));
			} else {
				print json_encode(array("success"=>false));
			}
		}
		break;
		
	case "file_download" :
		if ($path && strpos($folder,'.'.DIRECTORY_SEPARATOR)===false && $params['file']) {
			header("Content-type: application/x-download");
			header("Content-Disposition: attachment; filename=\"" . $params['file'] . "\";");
			header("Content-Length: " . filesize($path.DIRECTORY_SEPARATOR.$params['file']));
			print file_get_contents($path.DIRECTORY_SEPARATOR.$params['file']);
		}
		break;
	
	case 'file_upload' :
		if ($path && strpos($folder,'.'.DIRECTORY_SEPARATOR)===false && isset($_FILES['file']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
			$file = $_FILES['file'];
			$filename = $path . DIRECTORY_SEPARATOR . $file['name'];
			if (file_exists($filename)) {
				print json_encode(array("success"=>false));
			} else if (@copy($file['tmp_name'], $filename) == false) {
				@chmod($filename, DEFAULT_PRIVILEGES);
				print json_encode(array("success"=>false));
			} else {
				@chmod($filename, DEFAULT_PRIVILEGES);
				print json_encode(array("success"=>true,"file"=>$file['name'],"folder"=>$folder));
			}
		}
		break;
	
	case "file_properties" :
		if ($path && strpos($folder,'.'.DIRECTORY_SEPARATOR)===false && $params['file']) {
			$filename = $path . DIRECTORY_SEPARATOR . $params['file'];
			if (file_exists($filename)) {
				$properties = array();
				$pathinfo = pathinfo($filename);
				$stat = stat($filename);
				$properties["ctime"] = $stat["ctime"];
				$properties["mtime"] = $stat["mtime"];
				$properties["size"] = $stat["size"];
				$properties["perms"]=fileperms($filename);
				$properties['mime']=finfo_file(finfo_open(FILEINFO_MIME), $filename);
				
				if(in_array($pathinfo['extension'], $ext_images)){
					if ($imagesize = getimagesize($filename)){
						$properties['width'] = $imagesize[0];
						$properties['height'] = $imagesize[1];
					}
				}
				print json_encode(array("success"=>true,"file"=>str_replace(DIRECTORY,WEB_DIRECTORY,$filename),"info"=>$properties));
			} else {
				print json_encode(array("success"=>false));
			}
		}
		
		break;
		
	case "get_thumb" : 
		if ($path && strpos($folder,'.'.DIRECTORY_SEPARATOR)===false && $params['file']) {
			$thumbs_folder = $path . DIRECTORY_SEPARATOR . THUMBS_FOLDER;
			$source_file = $path. DIRECTORY_SEPARATOR . $params['file'];
			if (file_exists($source_file)) {
				$source_info = pathinfo($source_file);
				if(!in_array($source_info['extension'], $ext_images)){
					getNoThumb();
					break;
				}
				if (!file_exists($thumbs_folder)) {
					if (!@mkdir($thumbs_folder)) {
						getNoThumb();
						break;		
					}
					@chmod($thumbs_folder, DEFAULT_PRIVILEGES);
				}
				if ($source_image = imagecreatefromstring(file_get_contents($source_file))){
					list($source_width, $source_height) = @getimagesize($source_file);
					$source_ratio = $source_width / $source_height;
					$width = THUMBS_WIDTH;
					$height = THUMBS_HEIGHT; 
					if ($width / $height > $source_ratio) {
					   $width = ceil($height * $source_ratio);
					} else {
					   $height = ceil($width / $source_ratio);
					}
					if($source_width < $width && $source_height < $height) {
						$width = $source_width;
						$height = $source_height;
					}
					$image = @imagecreatetruecolor($width, $height);
					@imagefill($image,0,0,imagecolorallocate($image,255,255,255));
					@imagecopyresampled($image, $source_image, 0, 0, 0, 0, $width, $height, $source_width, $source_height);
					$imagename = $thumbs_folder . DIRECTORY_SEPARATOR . $params['file'] . '.jpg';
					if (@imagejpeg($image, $imagename, 70)){
						@chmod($imagename, DEFAULT_PRIVILEGES);
						@header("Location: ".str_replace(DIRECTORY,WEB_DIRECTORY,$imagename)); 
					}
				}
			}
		}
		getNoThumb();
		break;
}