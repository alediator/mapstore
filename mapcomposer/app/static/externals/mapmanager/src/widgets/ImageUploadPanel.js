/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/** api: (define)
 *  module = gxp
 *  class = ImageUploadPanel
 *  base_link = `Ext.FormPanel <http://extjs.com/deploy/dev/docs/?class=Ext.FormPanel>`_
 */
Ext.namespace("gxp");

/** api: constructor
 *  .. class:: ImageUploadPanel(config)
 *   
 *      A panel for uploading a new KML file.
 */
gxp.ImageUploadPanel = Ext.extend(Ext.FormPanel, {
    
    /** i18n */
    fileLabel: "Image file",
    fieldEmptyText: "Browse for image files...",
    uploadText: "Upload",
    waitMsgText: "Uploading your data...",
    invalidFileExtensionText: "File extension must be one of: ",
    resetText: "Reset",
    failedUploadingTitle: "Cannot upload file",
    /** end i18n */

    
    /** private: property[fileUpload]
     *  ``Boolean``
     */
    fileUpload: true,

    width: 500,
    frame: true,
    autoHeight: true,
    bodyStyle: 'padding: 10px 10px 0 10px;',
    labelWidth: 50,
    defaults: {
        anchor: '95%',
        allowBlank: false,
        msgTarget: 'side'
    },

    
    /** api: config[validFileExtensions]
     *  ``Array``
     *  List of valid file extensions.  These will be used in validating the 
     *  file input value.  Default is ``[".kml"]``.
     */
    validFileExtensions: [".png", ".jpg", ".gif"],
    
    /** api: config[url]
     *  ``String``
     *  URL for upload service.
     */
    
    /** private: method[constructor]
     */
    constructor: function(config) {
        // Allow for a custom method to handle upload responses.
        /*config.errorReader = {
            read: config.handleUploadResponse || this.handleUploadResponse.createDelegate(this)
        };*/
        this.service = config.service;
        gxp.ImageUploadPanel.superclass.constructor.call(this, config);
    },
    
    /** private: method[initComponent]
     */
    initComponent: function() {
        var self = this;
        
        this.items = [{
            xtype: "fileuploadfield",
            id: "file",
            emptyText: this.fieldEmptyText,
            fieldLabel: this.fileLabel,
            name: "file",
            buttonText: "",
            buttonCfg: {
                iconCls: "gxp-icon-filebrowse"
            },
            listeners: {
                "fileselected": function(cmp, value) {
                    // remove the path from the filename - avoids C:/fakepath etc.
                    cmp.setValue(value.split(/[/\\]/).pop());
                    self.filename = cmp.getValue();
                    self.buttons[0].enable();
                }
            },
            validator: this.fileNameValidator.createDelegate(this)
        }
        ];
        
        this.buttons = [{
            text: this.uploadText,
            disabled:true,
            handler: function() {
    
                var pattern = /(.+:\/\/)?([^\/]+)(\/.*)*/i;
                var mHost = pattern.exec(this.service);
                
                this.url = this.service;
                
                var ext = this.filename.slice(-4).toLowerCase();
                switch( ext ){
                    case '.png':
                    case '.jpg':
                    case '.gif':
                        this.url += 'FileUploader';
                        break;
                    default:
                        // this code should not be executed
                        console.log('unknown extention: cannot upload file.');
                        return;
                }
            
                var map = this.map;
                var form = this.getForm();
                if (form.isValid()) {
                    form.submit({
                        url: mHost[2] == location.host ? this.url : self.proxy ? self.proxy: "" + this.url,
                        submitEmptyText: false,
                        waitMsg: this.waitMsgText,
                        waitMsgTarget: true,
                        //reset: true,
                        scope: this,
                        failure: function(form, action){
                            Ext.Msg.show({
                                title: this.failedUploadingTitle,
                                msg: action.response.statusText + "(status " + action.response.status + "):  " + action.response.responseText,
                                buttons: Ext.Msg.OK,
                                icon: Ext.MessageBox.ERROR
                            });
                        },
                        success:this.handleUploadSuccess
                    });
                }
            },
            scope: this
        },{
            text: this.resetText,
            scope: this,
            handler: function(){
                this.getForm().reset();
            }
        }
        ];
        
        this.addEvents(

            /**
             * Event: uploadcomplete
             * Fires upon successful upload.
             *
             * Listener arguments:
             * panel - {<gxp.ImageUploadPanel} This form panel.
             * details - {Object} An object with the response of the uploaded image
             */
            "uploadcomplete"
            ); 

        gxp.ImageUploadPanel.superclass.initComponent.call(this);

    },
    
    /** private: method[fileNameValidator]
     *  :arg name: ``String`` The chosen filename.
     *  :returns: ``Boolean | String``  True if valid, message otherwise.
     */
    fileNameValidator: function(name) {
        var valid = false;
        var ext, len = name.length;
        for (var i=0, ii=this.validFileExtensions.length; i<ii; ++i) {
            ext = this.validFileExtensions[i];
            if (name.slice(-ext.length).toLowerCase() === ext) {
                valid = true;
                break;
            }
        }
        return valid || this.invalidFileExtensionText + '<br/>' + this.validFileExtensions.join(", ");
    },

    /** private: method[getUploadUrl]
     */
    getUploadUrl: function() {
        return this.url + "/upload";
    },
     
    /** private: method[handleUploadSuccess]
     */
    handleUploadSuccess: function(form, action) {
        var obj = Ext.decode( action.response.responseText );
        var filename = this.filename;
        var response = new Object;
        response.filename = filename;
        response.nfname = obj.result.newFileName;
        response.code = obj.result.code;
        response.url = this.url;
        this.fireEvent("uploadcomplete", this, response);
    }

});

/** api: xtype = gxp_imageuploadpanel */
Ext.reg("gxp_imageuploadpanel", gxp.ImageUploadPanel);
