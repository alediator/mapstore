/** api: (define)
 *  module = gsvq.plugins
 *  base_link = `Ext.util.Observable <http://extjs.com/deploy/dev/docs/?class=Ext.util.Observable>`_
 */
Ext.ns("gsvq.plugins");

/** api: constructor
 *  .. class:: LocationStartup(config)
 *
 *    Plugin to initialize the locations on Spanish Cadastre OSM wiki pages.
 *    Based on ´http://wiki.openstreetmap.org/wiki/Spanish_Cadastre/results/Sevilla´ wiki structure
 */
gsvq.plugins.LocationStartup = Ext.extend(mxp.plugins.Tool, {
    
    /** api: ptype = gsvq_categoryinitializer */
    ptype: "gsvq_categoryinitializer",

    /** i18n **/
    title: "Wiki Locations",
    loginLoadingMask: "Loading",

    /** config parameters **/
    url: "http://wiki.openstreetmap.org/wiki/Spanish_Cadastre/results/Sevilla",
    home: "http://wiki.openstreetmap.org",
    country: "Spain",
    city: "Sevilla",
    zoomLevel: 14,
    contentTpl: '{{place|name={city}|type=city|subarea|area={country}|image=|lat={lat}|long={lon}|zoom={zoomLevel}}}\n'+
            '<slippymap lat="{lat}" lon="{lon}" z="{zoomLevel}" w="450" h="380" layer="mapnik"></slippymap>',
    nominatimUrl: 'http://nominatim.openstreetmap.org/search?format=json',

    // icons for the action column
    icons: {
        link: "http://www.famfamfam.com/lab/icons/silk/icons/building_link.png",
        copy: "http://www.famfamfam.com/lab/icons/silk/icons/page_copy.png"
    },

    /** api: method[constructor]
     */
    constructor: function (config){
        Ext.apply(this, config);
        gsvq.plugins.LocationStartup.superclass.constructor.apply(this, arguments);    

        Ext.Ajax.request({
            url: this.url,
            method: "GET",
            disableCaching: false,
            success: function(response) {
                var parser=new DOMParser();
                this.htmlDoc= parser.parseFromString(response.responseText, "text/html");
                this.generateAllData();
            },
            scope: this
        });
    },

    currentCities: [],
    
    /** api: method[addOutput]
     *  :arg config: ``Object`` configuration for the ``Ext.Component`` to be
     *      added to the ``outputTarget``. Properties of this configuration
     *      will be overridden by the applications ``outputConfig`` for the
     *      tool instance.
     *  :return: ``Ext.Component`` The component added to the ``outputTarget``. 
     *
     *  Adds output to the tool's ``outputTarget``. This method is meant to be
     *  called and/or overridden by subclasses.
     */
    addOutput: function(config) {

        //grid with users associated with the group
        this.outputConfig = this.outputConfig ? this.outputConfig : {};
        
        Ext.apply(this.outputConfig,{  
            autoExpandColumn:'nomUrl',
            xtype:'grid',
            title: this.title,
            headers:false,
            layout:'fit',
            cm: this.getCitiesColumnModel(),
            store: this.getCitiesStore()
        });

        return gsvq.plugins.LocationStartup.superclass.addOutput.apply(this, arguments);
    },

    /** api: method[generateAllData]
     *  Read wiki base page and generate all wiki content based on nominatim response
     */
    generateAllData: function(){
        this.mask = new Ext.LoadMask(this.output[0].getEl(), {msg: this.loginLoadingMask});
        this.mask.show();
        var list = this.getLocations();
        this.waitingForLocations = list.length;
    },

    /** api: method[getList]
     *  Read the wiki content. If you want to extend this extractore to other province. 
     *  Based on `http://wiki.openstreetmap.org/wiki/Spanish_Cadastre/results/Sevilla` structure
     *  You must change this method
     */
    getList: function(){
        var list = [];
        var lookingFor = null;
        if(this.htmlDoc){
            var tdElements = this.htmlDoc.getElementsByTagName("td");
            for(var i = 0; i < tdElements.length; i++){
                if(tdElements[i].getElementsByTagName("h3") 
                    && tdElements[i].getElementsByTagName("h3").length == 1
                    && tdElements[i].getElementsByTagName("span") 
                    && tdElements[i].getElementsByTagName("span").length == 1
                    && tdElements[i].getElementsByTagName("span")[0].getAttribute("class") == "mw-headline"){
                    lookingFor = tdElements[i].getElementsByTagName("span")[0].getAttribute("id");   
                    //console.log("Looking for names starting with --> " + lookingFor);
                }else if(lookingFor 
                    && tdElements[i].getElementsByTagName("a") 
                    && tdElements[i].getElementsByTagName("a").length == 1
                    && tdElements[i].getElementsByTagName("a")[0].getAttribute("href")
                    && tdElements[i].getElementsByTagName("a")[0].getAttribute("title")
                    && tdElements[i].getElementsByTagName("a")[0].getAttribute("title").indexOf(lookingFor) == 0){
                    var name = tdElements[i].getElementsByTagName("a")[0].innerHTML;
                    var title = tdElements[i].getElementsByTagName("a")[0].getAttribute("title");
                    if(title.indexOf("page does not exist") >  -1){
                        var url = this.home + tdElements[i].getElementsByTagName("a")[0].getAttribute("href");
                        var nomUrl = this.getNominatimUrl(name);
                        // only not existing pages
                        var el = {
                            href: url,
                            name: name,
                            nominatimUrl: nomUrl,
                            city: name,
                            zoomLevel: this.zoomLevel,
                            country: this.country,
                            url: this.generateLink(url),
                            nomUrl: this.generateLink(nomUrl),
                        };
                        list.push(el);
                    }
                }
            }
        }
        this.currentCities = list;
        return list;
    },

    /** api: method[generateLink]
     *  Simply generate a link for the inner html
     */
    generateLink: function(value){
        return value.replace(/(https?:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>');
    },

    /** api: method[getNominatimUrl]
     *  Get the nominatim query url
     */
    getNominatimUrl: function(name, ctry, cty){
        var country = ctry ? ctry : this.country;
        var city = cty ? cty : this.city;
        // other tries to get the URL.
        // var url = this.nominatimUrl + "&city="+ name + "&country=" + country + "&province=Sevilla";
        // url = this.nominatimUrl + "&q="+ name + ", Sevilla&country=" + country + "&state=Sevilla";
        // url = this.nominatimUrl + "&q="+ name + ", " + city + ", " + country;
        var url = this.nominatimUrl + "&q="+ name + ", " + city + ", " + country;
        return encodeURI(url);
    },

    /** api: method[getLocations]
     *  Look for the nominatim locations for this.currentCities
     */
    getLocations: function(){
        if(!this.currentCities || this.currentCities.length == 0){
            this.currentCities = this.getList();
        }
            
        for(var i = 0; i < this.currentCities.length; i++){
            this.getLocation(this.currentCities[i], this.country, this.city);
        }

        return this.currentCities;
    },

    /** api: method[getLocation]
     *  Get the latitude and longitude for a location record based on a country and city names
     */
    getLocation:function (location, country, city){
        if(!location.lat && !location.lon){
            Ext.Ajax.request({
                url: location.nominatimUrl ? location.nominatimUrl : this.getNominatimUrl(location.name, country, city),
                method: "GET",
                disableCaching: false,
                success: function(response) {
                    var json = Ext.decode(response.responseText);
                    location.nominatimJSON = json;
                    // now get the better result
                    if(json.length > 0){
                        var betterIndex = 0;
                        var foundResults = 0;
                        for(var i= 0; i < json.length; i++){
                            var matches = 0;
                            if(json[i].display_name){
                                if(country && (json[i].display_name.indexOf(country) > -1))
                                    matches++;
                                if(city && (json[i].display_name.indexOf(city) > -1))
                                    matches++;
                            }
                            if(matches> foundResults){
                                foundResults = matches;
                                betterIndex = i;
                            }
                        }
                        if(foundResults != 2){
                            // it means that not found the full name and the contry name in the response.
                            console.log("[Caution] Not found, please retry or use URL manually --> " + json[betterIndex].display_name);
                        }else{
                            // it's a right response
                            location.lat = json[betterIndex].lat;
                            location.lon = json[betterIndex].lon;
                            location.selectedNode = json[betterIndex];
                        }
                    }
                    this.waitingForLocations--;
                    if(this.waitingForLocations == 0){
                        // all locations founds, then generate wiki content
                        this.generateWikiContent();
                    }
                },
                scope: this
            }); 
        }
    },

    /** api: method[generateWikiContent]
     *  Get the wiki content based on this.contentTpl template
     */
    generateWikiContent: function(){
        var template = new Ext.Template(this.contentTpl);
            
        for(var i = 0; i < this.currentCities.length; i++){
            if(this.currentCities[i].lon && this.currentCities[i].lat){
                this.currentCities[i].wikiContent = template.apply(this.currentCities[i]);
            }
        }

        // find the final store with this.currentCities
        this.bindStore();

        return this.currentCities;
    },

    /** api: method[getCitiesColumnModel]
     *  Column model for the grid
     */
    getCitiesColumnModel: function(){
        return new Ext.grid.ColumnModel({
                columns: [ {
                    id:'name',
                    dataIndex:'name',
                    header: "City"
                },{
                    id:'wikiContent',
                    dataIndex:'wikiContent',
                    header: "Wiki"
                },{
                    id:'nomUrl',
                    dataIndex:'nomUrl',
                    header: "Nominatim URL"
                },{
                    id:'url',
                    dataIndex:'url',
                    header: "Edit URL"
                },{
                    xtype: "actioncolumn",
                    header: "Edit URL",
                    items:[{
                        title: "Edit",
                        // icon: "delete_icon",
                        icon: this.icons.link,
                        tooltip: "Edit the city wiki page",
                        handler: function(grid, rowIndex, colIndex, item, e){
                            var rec = grid.store.getAt(rowIndex);
                            var href = rec.get("href");
                            var openedWindow = window.open(href, "_blank");
                            if(openedWindow){
                                rec.editWindow = openedWindow;
                            }else{
                                console.error("Please let me open the editor");
                            }
                            
                        }
                    },{
                        title: "Copy",
                        // icon: "delete_icon",
                        icon: this.icons.copy,
                        // disabled: true,
                        tooltip: "Copy generated content",
                        handler: function(grid, rowIndex, colIndex){
                            var rec = grid.store.getAt(rowIndex);
                            window.prompt("Copy to clipboard: Ctrl+C, Enter", rec.get("wikiContent"));
                        }
                    }]
                }
            ]});
    },

    /** api: method[getCitiesStore]
     *  Store for the grid based on this.currentCities store generated
     */
    getCitiesStore: function(){
        return new Ext.data.JsonStore({
            fields:['city', 'country', 'url', 'zoomLevel', 'name', 'zoomLevel', "wikiContent", "nomUrl", "href"],
            autoDestroy:true,
            data:this.currentCities
        });
    },

    /** api: method[bindStore]
     *  Reconfigure current output with current cities and column model
     */
    bindStore: function(){

        if(this.output && this.output[0]){
            this.output[0].reconfigure(this.getCitiesStore(), this.getCitiesColumnModel());
        }else{
            this.addOutput();
        }
        
        this.mask.hide();
    }


});

Ext.preg(gsvq.plugins.LocationStartup.prototype.ptype, gsvq.plugins.LocationStartup);