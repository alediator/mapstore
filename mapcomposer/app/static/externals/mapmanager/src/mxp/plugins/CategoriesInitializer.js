/*
 *  Copyright (C) 2007 - 2014 GeoSolutions S.A.S.
 *  http://www.geo-solutions.it
 *
 *  GPLv3 + Classpath exception
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
 
/** api: (define)
 *  module = mxp.plugins
 *  class = Tool
 *  base_link = `Ext.util.Observable <http://extjs.com/deploy/dev/docs/?class=Ext.util.Observable>`_
 */
Ext.ns("mxp.plugins");

/** api: constructor
 *  .. class:: CategoriesInitializer(config)
 *
 *    Plugin to initialize the categories
 */
mxp.plugins.CategoriesInitializer = Ext.extend(mxp.plugins.Tool, {
    
    /** api: ptype = mxp_categoryinitializer */
    ptype: "mxp_categoryinitializer",

    /** i18n **/
    geostoreInitializationTitleText: "Initializing Fail",
    geostoreInitializationText: "Geostore response is not the expected",
    /** EoF i18n **/

    /** api: config[silentErrors] 
     *  ``Boolean`` Flag to hide error window.
     */
    silentErrors: false,

    /** api: config[adminAuthorization] 
     *  ``String`` Authorization header to use. You can put the header or use the ``adminCredentials``
     */
    adminAuthorization: null,

    /** api: config[adminCredentials] 
     *  ``Object`` GeoStore administrator user name and password
     */
    adminCredentials: {
        user: "admin",
        pass: "admin"
    },

    /** api: config[neededCategories] 
     *  ``Array`` Name of categories to be initialized in an array
     */
    neededCategories: ["TEMPLATE", "MAP"],

    /** api: config[checkDefaultTemplate] 
     *  ``Boolean`` Flag to initialize templates in `defaultTemplates`
     */
    checkDefaultTemplate: true,

    /** api: config[defaultTemplates] 
     *  ``Array`` Templates to be created at startup if not found in an array
     */
    defaultTemplates:[{ 
        name: "Default", 
        owner: "admin",
        description: "Default empty template",
        blob: "{}"
    }],

    /** private: method[init]
     */
    init: function(target){
        mxp.plugins.CategoriesInitializer.superclass.init.apply(this, arguments); 

        // prepare credentials and categories
        if(!this.adminAuthorization && this.adminCredentials){
            this.adminAuthorization = 'Basic ' + Base64.encode(this.adminCredentials.user+':'+this.adminCredentials.pass);
        }
        var auth = this.adminAuthorization ? this.adminAuthorization : this.target.auth;
        var me = this;
        this.categories = new GeoStore.Categories({
            authorization: auth,
            url: this.target.initialConfig.geoStoreBase + "categories"
            }).failure( function(response){
                if(!me.silentErrors){  
                    // not found!!
                    Ext.Msg.show({
                       title: me.geostoreInitializationTitleText,
                       msg: me.geostoreInitializationText + ": " + response.statusText + "(status " + response.status + "):  " + response.responseText,
                       buttons: Ext.Msg.OK,
                       icon: Ext.MessageBox.ERROR
                    });
                }
        });

        // check categories
        this.checkAndCreateCategories(this.neededCategories);

        // templates
        if(this.checkDefaultTemplate){
            this.templates = new GeoStore.Templates({
                authorization: auth,
                url: this.target.initialConfig.geoStoreBase + 'resources'
                }).failure( function(response){
                    if(!me.silentErrors){  
                        // not found!!
                        Ext.Msg.show({
                           title: me.geostoreInitializationTitleText,
                           msg: me.geostoreInitializationText + ": " + response.statusText + "(status " + response.status + "):  " + response.responseText,
                           buttons: Ext.Msg.OK,
                           icon: Ext.MessageBox.ERROR
                        });
                    }
            });
        }

    },

    /** api: method[checkAndCreateCategories]
     *  Check if the category names are present and create it if not found
     */
    checkAndCreateCategories: function(categoryNames){

        var me = this;
        this.categories.find(function(categories){
            for(var i = 0; i < categories.length; i++){
                var found = false;
                for(var j = 0; j < categoryNames.length; j++){
                    if(categories[i].name == categoryNames[j]){
                        found = true;
                        break;
                    }
                }
                if(found){
                    categoryNames.remove(categories[i].name);
                }
            }
            me.createCategories(categoryNames);
        });

    },

    /** api: method[createCategories]
     *  Create categories with the names in this.categoryNames
     */
    createCategories: function(categoryNames){
        var me = this;
        var pending = categoryNames.length;
        for(var i = 0; i < categoryNames.length; i++){
            this.categories.create({
                name: categoryNames[i]
            }, function(responseText){
                // creation succeeded
                if(me.checkDefaultTemplate && --pending == 0){
                    // check templates
                    me.checkAndCreateDefaultTemplates(me.defaultTemplates);
                }
            });
        }
    },

    /** api: method[checkAndCreateDefaultTemplates]
     *  Create templates with the names in templatesConfig identified by name.
     */
    checkAndCreateDefaultTemplates: function(templatesConfig){
        var me = this;
        this.templates.find(function(templates){
            for(var i = 0; i < templates.length; i++){
                var found = false;
                for(var j = 0; j < templatesConfig.length; j++){
                    if(templates[i].name == templatesConfig[j].name){
                        found = true;
                        break;
                    }
                }
                if(found){
                    templatesConfig.remove(templatesConfig[j]);
                }
            }
            me.createTemplates(templatesConfig);
        });
    },

    /** api: method[createTemplates]
     *  Create templates in toAddTemplates array
     */
    createTemplates: function(toAddTemplates){
        for(var i = 0; i < toAddTemplates.length; i++){
            this.templates.create(toAddTemplates[i], function(responseText){
                // creation succeeded
            });
        }
    }
});

Ext.preg(mxp.plugins.CategoriesInitializer.prototype.ptype, mxp.plugins.CategoriesInitializer);