var RRPageParam = {};
$.each(window.location.search.substr(1).split('&'), function (n, m) {
    RRPageParam[(m.split('=')[0])] = m.split('=')[1];
});

var RRLog = function(x) {
    if (RRPageParam.log !== undefined) {
        console.log(x);
    }
};



// resources
(function() {
    $('[data-rrresourcesplaceholder]').each(function(n,m){
        var rrid = $(m).data().rrresourcesplaceholder;
        m.placeholder = RRResourcesText[rrid];
    });
})();

var RRSuiteBar = (function () {
    var m_is_hidden = true;
    
    var isHidden = function () { return m_is_hidden; };
	
    function show() {
        m_is_hidden = false;
        $('body').removeClass('ohPublishing');
        $('#s4-ribbonrow').show().css('height', '35px');
    }

    function hide() {
        m_is_hidden = true;
        $('body').addClass('ohPublishing');
        $('#s4-ribbonrow').hide().css('height', '0px');
    }

    return {
        show: show,
        hide: hide,
        isHidden: isHidden
    };
})();

var RR_TermSet = (function () {
    var getTermSetById = function (id) {
        var deferred = $.Deferred();
        SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
            SP.SOD.registerSod('sp.taxonomy.js', SP.Utilities.Utility.getLayoutsPageUrl('sp.taxonomy.js'));
            SP.SOD.executeFunc('sp.taxonomy.js', 'SP.Taxonomy.TaxonomySession', function () {
                    var ctx = SP.ClientContext.get_current(),
                        taxonomySession = SP.Taxonomy.TaxonomySession.getTaxonomySession(ctx),
                        termStore = taxonomySession.getDefaultSiteCollectionTermStore(),
                        termSet = termStore.getTermSet(id),
                        terms = termSet.getAllTerms();
                    ctx.load(terms);
                    ctx.executeQueryAsync(function () {
                        deferred.resolve(terms);
                    }, function (sender, args) {
                        deferred.reject(args);
                        console.error(args.get_message());
                    });
                });
            });
        return deferred.promise();
    };

    var getTermSetByName = function (name) {
        var deferred = $.Deferred();
        SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
            SP.SOD.registerSod('sp.taxonomy.js', SP.Utilities.Utility.getLayoutsPageUrl('sp.taxonomy.js'));
            SP.SOD.executeFunc('sp.taxonomy.js', 'SP.Taxonomy.TaxonomySession', function () {

                var ctx = SP.ClientContext.get_current(),
                    taxonomySession = SP.Taxonomy.TaxonomySession.getTaxonomySession(ctx),
                    termStore = taxonomySession.getDefaultSiteCollectionTermStore();
                ctx.load(termStore);
                ctx.executeQueryAsync(function() {
                    var lang = termStore.get_defaultLanguage(),
                    tsetcollection = termStore.getTermSetsByName(name,lang);
                    ctx.load(tsetcollection);
                    ctx.executeQueryAsync(function() {
                        if (tsetcollection.get_count() >= 1) {
                            var termSet = tsetcollection.itemAt(0);
                            var terms = termSet.getAllTerms();
                            ctx.load(terms);
                            ctx.executeQueryAsync(function () {
                                deferred.resolve(terms);
                            }, function (sender, args) {
                                deferred.reject(args);
                                console.error(args.get_message());
                            });
                        } else {
                            console.warn('termset [' + name + '] not found');
                            deferred.reject();
                        }
                        }, function (sender, args) {
                            deferred.reject(args);
                            console.error(args.get_message());
                        });
                    }, function (sender, args) {
                        console.error(args.get_message());
                    });
                });
            });
        return deferred.promise();
    };

    var getSubTermsById = function (id) {
        var deferred = $.Deferred();
        SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
            SP.SOD.registerSod('sp.taxonomy.js', SP.Utilities.Utility.getLayoutsPageUrl('sp.taxonomy.js'));
            SP.SOD.executeFunc('sp.taxonomy.js', 'SP.Taxonomy.TaxonomySession', function () {
                    var ctx = SP.ClientContext.get_current(),
                        taxonomySession = SP.Taxonomy.TaxonomySession.getTaxonomySession(ctx),
                        termStore = taxonomySession.getDefaultSiteCollectionTermStore(),
                        //termSet = termStore.getTermSet(id),
                        //terms = termSet.getAllTerms();
                        term = termStore.getTerm(id),
                        terms = term.get_terms();

                    ctx.load(term);
                    ctx.load(terms);
                    ctx.executeQueryAsync(function () {
                        deferred.resolve(terms);
                    }, function (sender, args) {
                        deferred.reject(args);
                        console.error(args.get_message());
                    });
                });
            });
        return deferred.promise();
    };

    var getTermSetAsTree = function (termSetId) {
        var deferred = $.Deferred();
        getTermSetById(termSetId).then(function (terms) {
            var tree = createTermsTree(terms);
            var list = createTermsLookup(terms);
            sortTermsFromTree(tree);
            deferred.resolve({tree:tree,list:list});
        });
        return deferred.promise();
    };

    var getTermSetByNameAsTree = function (termSetName) {
        var deferred = $.Deferred();
        getTermSetByName(termSetName).then(function (terms) {
            var tree = createTermsTree(terms);
            var list = createTermsLookup(terms);
            sortTermsFromTree(tree);
            deferred.resolve({tree:tree,list:list});
        });
        return deferred.promise();
    };

    var getTermAsTree = function (termId) {
        var deferred = $.Deferred();
        getSubTermsById(termId).then(function (terms) {
            var tree = createTermsTree(terms);
            var list = createTermsLookup(terms);
            sortTermsFromTree(tree);
            deferred.resolve({tree:tree,list:list});
        });
        return deferred.promise();
    };

    var getSubTermsForTerm = function(termGuid) {
        var deferred = $.Deferred();
        var ctx = SP.ClientContext.get_current(),
        taxonomySession = SP.Taxonomy.TaxonomySession.getTaxonomySession(ctx),
        termStore = taxonomySession.getDefaultSiteCollectionTermStore();
        ctx.load(termStore);
        ctx.executeQueryAsync(function() {
            RRLog('ok');
            var term = termStore.getTerm(termGuid);
            ctx.load(term);
            ctx.executeQueryAsync(function() {
                RRLog('ok');
                var terms = term.get_terms();
                    ctx.load(terms);
                    ctx.executeQueryAsync(function() {
                    deferred.resolve(terms);
                });
            });
        });
        return deferred.promise();
    };
    
    var createTermsTree = function(terms) {
        var tree = {
            term: terms,
            children: []
        };
        var termsEnumerator = terms.getEnumerator();
        // Loop through each term
        while (termsEnumerator.moveNext()) {
            var currentTerm = termsEnumerator.get_current();
            var currentTermPath = currentTerm.get_pathOfTerm().split(';');
            var children = tree.children;

            // Loop through each part of the path
            for (var i = 0; i < currentTermPath.length; i++) {
                var foundNode = false;

                for (var j = 0; j < children.length; j++) {
                    if (children[j].name === currentTermPath[i]) {
                        foundNode = true;
                        break;
                    }
                }

                // Select the node, otherwise create a new one
                var term = foundNode ? children[j] : { name: currentTermPath[i], children: [] };

                // If we're a child element, add the term properties
                if (i === currentTermPath.length - 1) {
                    term.term = currentTerm;
                    term.title = currentTerm.get_name();
                    term.guid = currentTerm.get_id().toString();
                }

                // If the node did exist, let's look there next iteration
                if (foundNode) {
                    children = term.children;
                }
                // If the segment of path does not exist, create it
                else {
                    children.push(term);

                    // Reset the children pointer to add there next iteration
                    if (i !== currentTermPath.length - 1) {
                        children = term.children;
                    }
                }
            }
        }
        return tree;
    };

    /**
     * Sort children array of a term tree by a sort order
     *
     * @param {obj} tree The term tree
     * @return {obj} A sorted term tree
     */
    var sortTermsFromTree = function (tree) {
        // Check to see if the get_customSortOrder function is defined. If the term is actually a term collection,
        // there is nothing to sort.
        if (tree.children.length && tree.term.get_customSortOrder) {
            var sortOrder = null;
 
            if (tree.term.get_customSortOrder()) {
                sortOrder = tree.term.get_customSortOrder();
            }
 
            // If not null, the custom sort order is a string of GUIDs, delimited by a :
            if (sortOrder) {
                sortOrder = sortOrder.split(':');
 
                tree.children.sort(function (a, b) {
                    var indexA = sortOrder.indexOf(a.guid);
                    var indexB = sortOrder.indexOf(b.guid);
 
                    if (indexA > indexB) {
                        return 1;
                    } else if (indexA < indexB) {
                        return -1;
                    }
 
                    return 0;
                });
            }
            // If null, terms are just sorted alphabetically
            else {
                tree.children.sort(function (a, b) {
                    if (a.title > b.title) {
                        return 1;
                    } else if (a.title < b.title) {
                        return -1;
                    }
 
                    return 0;
                });
            }
        }
 
        for (var i = 0; i < tree.children.length; i++) {
            tree.children[i] = sortTermsFromTree(tree.children[i]);
        }
 
        return tree;
    };

    var createTermsLookup = function (terms) {
        var termsList = {};
        var termsEnumerator = terms.getEnumerator();
        // Loop through each term
        while (termsEnumerator.moveNext()) {
            var currentTerm = termsEnumerator.get_current();
			var t = {
				name: currentTerm.get_name(),
				props: currentTerm.get_customProperties()
			};
			termsList[currentTerm.get_id().toString()] = t;
        };
        return termsList;
    };
    
    var getValueFromPropertyBag = function(name) {
        var deferred = $.Deferred();
        $.ajax({
            type: 'GET',
            url: _spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'') + '/_api/web/allproperties?$select=' + name,
            headers: {
                "accept": "application/json;odata=verbose",
                "content-type": "application/json;odata=verbose",
            },
            success: function (result) { deferred.resolve(result.d[name]); },
            error: function (error) { deferred.reject(error); }
        });
        return deferred.promise();
    };
    
    return {
        getValueFromPropertyBag: getValueFromPropertyBag,
        getTermSetAsTree: getTermSetAsTree,
        getTermSetByNameAsTree: getTermSetByNameAsTree,
        getTermAsTree: getTermAsTree,
        getSubTermsForTerm: getSubTermsForTerm
    };
})();

var RRDataModule = (function() {
    // #################################################
    var ohappdate = new Date("2016-11-29T10:00");
    // #################################################
    var m_event_rowlimit=RRCfg.event_rowlimit;
	var m_companycodes_temp = {};
	var m_companycodes = {
        default: {
            guid: '0',
            name: 'Royal Reesink NV',
            businessname: 'RENV',
            code: 'LE001',
            isgroup: true,
            isavailable: true,
            ischecked: true,
            ishiddenfilter: true
        },
        guids: {},
        names: {},
        lastmodifieddate: new Date("2016-01-01").toJSON()
    };
	var m_pinned = [];
    var m_userprofile = {
        AccountName: '',
        RRMyCompany: '',
        RRMyCompanyUrl: '',
        RRIntranet: '',
        RRIntranetJSON: { unpinneditems: [], filter: [] }
    };
    var m_refiners = {};
    
	var _get_my_userprofile = function() {
        var deferred = $.Deferred();
        console.info('get userprofile from cookie...');
        var r = Cookies.get(RRCfg.cookies.RRUserProfile.name);
        if (r !== null) {
            try { 
                var upp = JSON.parse(r);
                m_userprofile = {
                    AccountName: upp.AccountName,
                    RRMyCompany: upp.RRMyCompany,
                    RRIsSpUser: upp.RRIsSpUser,
                    RRIntranet: upp.RRIntranet,
                    RRIntranetJSON: JSON.parse(upp.RRIntranet)
                };
                console.info('... got userprofile from cookie');
                if (_check_app_version()) {
                    deferred.resolve();
                }
            }
            catch(e) { }
        }

        console.info('get userprofile from store ...');
		SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
			SP.SOD.executeFunc('userprofile', 'SP.UserProfiles.PeopleManager', function () {
				var clientContext, peopleManager, userProfileProperties;
				clientContext = SP.ClientContext.get_current();
				peopleManager = new SP.UserProfiles.PeopleManager(clientContext);
				userProfileProperties = peopleManager.getMyProperties();
				clientContext.load(userProfileProperties);
				clientContext.executeQueryAsync(function () {
					var upp = userProfileProperties.get_userProfileProperties();
                    m_userprofile = {
                        AccountName: upp.AccountName,
                        RRMyCompany: upp.RRMyCompany,
                        RRIsSpUser: Boolean.parse(upp.RRIsSpUser),
                        RRIntranet: upp.RRIntranet,
                        RRIntranetJSON: (upp.RRIntranet === '') ? m_userprofile.RRIntranetJSON : JSON.parse(upp.RRIntranet)
                    };
                    console.info('... got userprofile from store');
                    if (_check_app_version()) {
                        Cookies.set(RRCfg.cookies.RRUserProfile.name,m_userprofile);
                        console.info('... saved userprofile to cookie');
                    }
                    deferred.resolve();
				}, function (sender, args) {
                    console.error('... userprofile failed');
					deferred.reject(args);
				});
			});
		});
		return deferred.promise();
	};

    var _check_app_version = function() {
        if (m_userprofile.RRIntranetJSON.ohappdate === undefined || new Date(m_userprofile.RRIntranetJSON.ohappdate) < ohappdate){
            console.info("app updated");
            m_userprofile.RRIntranetJSON.ohappdate = ohappdate;
            clearAll();
            return false;
        } else {
            return true;
        }
    };
    
    var _get_company_data = function(name) {
        if (name === undefined || name === "") {
            return m_companycodes.default;
        } else {
            var cguid = name.split(';')[1].split('|')[1].replace(/^#0/,'');
            var cname = name.split(';')[1].split('|')[2];
            var comp = m_companycodes.guids[cguid];
            if (comp === undefined) {
                if (m_companycodes_temp[cguid] === undefined) {
                    m_companycodes_temp[cguid] = {guid: cguid, code: cguid, businessname: cguid, name: cname};
                }
                comp = m_companycodes_temp[cguid];
            }
            //$.extend(comp, {guid: cguid, name: cname});
            return comp;
        }
    };

    var _update_user_profile_intranet_settings = function () {
        console.info('update userprofile intranet settings...');
        m_userprofile.RRIntranetJSON.unpinneditems = $.unique(m_userprofile.RRIntranetJSON.unpinneditems);
        m_userprofile.RRIntranet = JSON.stringify(m_userprofile.RRIntranetJSON);
        _update_userprofile_property(RRCfg.customuserprofileproperties.RRIntranet.name, m_userprofile.RRIntranet)
            .then(function(){ 
                console.info('... userprofile updated');
            }, function(r){ 
                console.error('userprofile update failed'); 
                console.error(r.get_message());
            });
    };
    
    var showAll = function() {
		Cookies.get(RRCfg.cookies.RRUserProfile.name);
		return m_userprofile;
	};
	
    var clearAll = function() {
		m_userprofile.RRIntranetJSON.unpinneditems = [];
		m_userprofile.RRIntranetJSON.filter = [];
		localStorage.removeItem(RRCfg.localstorage.RRCompanies.name);
		_update_user_profile_intranet_settings();
		Cookies.remove(RRCfg.cookies.RRUserProfile.name);
		console.info('cleared');
		return m_userprofile;
    };

	var _update_userprofile_property = function(propertyName, propertyValue) {
        var deferred = $.Deferred();
		SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
			SP.SOD.executeFunc('userprofile', 'SP.UserProfiles.PeopleManager', function () {
				var clientContext, peopleManager, userProfileProperties;
				clientContext = SP.ClientContext.get_current();
				peopleManager = new SP.UserProfiles.PeopleManager(clientContext);
				peopleManager.setSingleValueProfileProperty(m_userprofile.AccountName, propertyName, propertyValue);
				clientContext.executeQueryAsync(function () {
                    Cookies.set(RRCfg.cookies.RRUserProfile.name,m_userprofile);
                    console.info('... saved userprofile to cookie');
					deferred.resolve();
				}, function (sender, args) {
					deferred.reject(args);
				});
			});
		});
		return deferred.promise();
	};
    
    var _process_relevant_result = function(results) {
        var result = {};
        $.each(results, function(x,m) {
            switch(m.Key){
                //case 'PublishingPageImageOWSIMGE':
                //    result[m.Key] = m.Value && $(m.Value).attr('src').toLowerCase().replace(/\?renditionid=.*/,'');
                //break;
                case 'PublishingImage':
                    result[m.Key] = m.Value && $(m.Value).attr('src').toLowerCase().replace(/\?renditionid=.*/,'');
                break;
                case 'LastModifiedTime':
                    result['modifieddate'] = m.Value ? new Date(m.Value) : null;
                    result['modifiedmoment'] = m.Value ? moment(m.Value) : null;
                break;
                //case 'owstaxIdRRCompanyName':
                //    result['company'] = _get_company_data(m.Value);
                //break;
                case 'RefinableString01':
                    result['company'] = _get_company_data(m.Value);
                break;
				case 'ArticleStartDateOWSDATE':
                    result[m.Key] = m.Value;
                    result['articlestartdate'] = m.Value ? new Date(m.Value) : null;
                    result['articlestartmoment'] = m.Value ? moment(m.Value) : null;
				break;
				case 'RefinableDate00':
                    result[m.Key] = m.Value;
                    var x = new Date(m.Value);
                    x.setHours(x.getHours()+3);
                    result['articlestartdate00'] = m.Value ? x : null;
                    result['articlestartmoment00'] = m.Value ? moment(x) : null;
				break;
				case 'RRStartDateOWSDATE':
                    result[m.Key] = m.Value;
                    result['rrstartdate'] = m.Value ? new Date(m.Value) : null;
                    result['rrstartmoment'] = m.Value ? moment(m.Value) : null;
				break;
                case 'EventDateOWSDATE':
                    result['startdate'] = m.Value ? new Date(m.Value) : null;
                    result['startmoment'] = m.Value ? moment(m.Value) : null;
                break;
                case 'EndDateOWSDATE':
                    result['enddate'] = m.Value ? new Date(m.Value) : null;
                    result['endmoment'] = m.Value ? moment(m.Value) : null;
                break;
                case 'WebPageOWSURLH':
                    if (m.Value !== null) {
                        result['webpage'] = { Url: m.Value.split(', ')[0], Description: m.Value.split(', ')[1] || m.Value.split(', ')[0] };
                    } else {
                        result['webpage'] = null;
                    }
                break;
                case 'owstaxIdRRTag':
                    result['tags'] = $.map(m.Value.split(';'),function(m,n){if(m.split('|')[0] === 'L0'){return m.split('|')[2];}}).join(', ');
                break;
                case 'RRExternalUrlOWSURLH':
                    if (m.Value !== null) {
                        result['externalurl'] = { Url: m.Value.split(', ')[0], Description: m.Value.split(', ')[1] || m.Value.split(', ')[0] };
                    } else {
                        result['externalurl'] = null;
                    }
                break;
                case 'RRAuthorOWSUSER':
                    result[m.Key] = m.Value;
                    var authors = m.Value || result['Author'] || '';
                    var users = authors.split(' | ');
                    var RRAuthor = [];
                    for (i=0;i<users.length;i+=2) {
                        var email = users.slice(i,i+2)[0].split(' ').pop();
                        var name = users.slice(i,i+2)[1] || '';
                        if (name !== '') {
                            RRAuthor.push({email: email, name: name});
                        }
                    }
                    result['RRAuthor'] = RRAuthor;
                break;
                default:
                    result[m.Key] = m.Value === null ? "" : m.Value;
                }
        });
        return result;
    };
    
    var _process_refinement_results = function(results) {
        if (!results || !results.Refiners || ! results.Refiners.results) { 
            console.info('no refiners found');
            return;
        }
        $.each(results.Refiners.results, function(n1,m1) {
            m_refiners[m1.Name] = [];
            $.each(m1.Entries.results, function(n2,m2){
                var rf = {};
				var rfv = m2.RefinementValue.split('|');
                if (rfv[0] === 'L0') {
                    rf.id = rfv[1].replace('#0','');
                    rf.name = rfv[2];
                    rf.token = m2.RefinementToken;
                } else {
                    rf.id = '';
                    rf.name = m2.RefinementValue
                    rf.token = m2.RefinementToken;
                }
                m_refiners[m1.Name].push(rf);
            });
        });
    };
    
    var RRDataConfig = {
        RRDefault: {
            resultsource: 'SSA|Local SharePoint Results',
            querytext: '*',
            properties: '',
            sortlist: [],
            template: '',
            startrow: 0,
            rowlimit: 10
        },
        RRCurrent: {
            resultsource: 'RRHoldingNews',
            template: '#current-template',
            properties: 'ContentTypeId,DocId,Path,Url,Title,PublishingImage,Author,RRAuthorOWSUSER,RefinableString01,owstaxIdRRCompanyName,owstaxIdRRTag,RRPinnedOWSBOOL,RRPinnedUntilOWSDATE,RefinableDate01,ArticleByLineOWSTEXT,SPWebUrl,ListID,ListItemID,ArticleStartDateOWSDATE,RefinableDate00,ModifiedOWSDATE,Location,EventDateOWSDATE,RefinableDate01,EndDateOWSDATE,fAllDayEvent,RRYammerIdOWSTEXT',
            startrow: 0,
            rowlimit: RRCfg.current_rowlimit,
            removepinned: true,
            filter: m_userprofile.RRIntranetJSON.filter
        },
        RRCurrentReveal: {
            template: '#modal-reveal-template1',
            querytext: "'WorkId:{docid}'&rowlimit=1",
            properties: 'Path,DocId,Title,Author,RRAuthorOWSUSER,RefinableString01,owstaxIdRRCompanyName,owstaxIdRRTag,PublishingImage,PublishingPageContentOWSHTML,ArticleByLineOWSTEXT,ArticleStartDateOWSDATE,RefinableDate00,RRYammerIdOWSTEXT'
        },
        RRCompanyCurrent: {
            resultsource: 'RRCompanyNews',
            template: '#current-template',
            properties: 'ContentTypeId,DocId,Path,Url,Title,PublishingImage,Author,RRAuthorOWSUSER,RefinableString01,owstaxIdRRCompanyName,owstaxIdRRTag,RRPinnedOWSBOOL,RRPinnedUntilOWSDATE,RefinableDate01,ArticleByLineOWSTEXT,SPWebUrl,ListID,ListItemID,ArticleStartDateOWSDATE,RefinableDate00,ModifiedOWSDATE,Location,EventDateOWSDATE,RefinableDate01,EndDateOWSDATE,fAllDayEvent',
            startrow: 0,
            rowlimit: RRCfg.current_rowlimit,
            removepinned: false
        },
        RRPinned: {
            resultsource: 'RRHoldingNewsPinned',
            template: '#current-pinned-template',
            properties: 'DocId,Path,Url,Title,PublishingImage,RefinableString01,owstaxIdRRCompanyName,RRPinnedUntilOWSDATE,RefinableDate01,ArticleByLineOWSTEXT,SPWebUrl,ListID,ListItemID,ArticleStartDateOWSDATE,RefinableDate00,ModifiedOWSDATE'
        },
        RREvent: {
            template: '#event-details',
            querytext: "'WorkId:{docid}'",
            properties: 'Title,Location,EventDateOWSDATE,RefinableDate02,EndDateOWSDATE,RefinableString01,ArticleStartDateOWSDATE,RefinableDate00,owstaxIdRRCompanyName,owstaxIdRRTag,fAllDayEvent,RRImageOWSURLH,RRExternalUrlOWSURLH,Description,RREventOrganizerOWSUSER,Path,LastModifiedTime,ModifiedById',
            rowlimit: 1
        },
        RRVacancies: {
            resultsource: 'RRVacancies',
            template: '#vacancy-template',
            properties: 'Title,RefinableString01,owstaxIdRRCompanyName,HomeAddressCityOWSTEXT,RRVacancyContractTypeOWSTEXT,Path,RRStartDateOWSDATE,RefinableDate03,RRExternalUrlOWSURLH',
            rowlimit: 3
        },
        RRMyCompany: {
            resultsource: 'RRMyCompany',
            template: '#mycompany-category',
            properties: 'ContentType,DocId,Path,Url,Title,RRExternalUrlOWSURLH',
            termsetname: 'My Company Categories',
            sortlist: ["Filename:ascending"],
            rowlimit: 20
        },
        RRAllCompanies: {
            template: '#allcompanies-template'
        },
        RRTaggedContent: {
            resultsource: 'RRTaggedContent',
            template: '#taggedcontent-template',
            properties: 'Title,Path,Location,ContentType,RefinableString01,owstaxIdRRCompanyName,DocId,RRExternalUrlOWSURLH,ListID,ListItemID'
        },
        RRTaggedDocuments: {
            resultsource: 'RRTaggedDocuments',
            template: '#taggeddocuments-template',
            properties: 'Title,Path,Location,ContentType,RefinableString01,owstaxIdRRCompanyName,DocId'
        },
        RRTaggedEvents: {
            resultsource: 'RRTaggedEvents',
            template: '#taggedevents-template',
            properties: 'Title,Path,Location,ContentType,EventDateOWSDATE,RefinableDate02,EndDateOWSDATE,RefinableString01,owstaxIdRRCompanyName,fAllDayEvent,DocId'
        }
    };

    var RRSearch = (function(cfg){
        var defaultCfg = {
            resultsource: 'SSA|Local SharePoint Results',
            querytext: '*',
            properties: '',
            sortlist: [],
            template: '',
            startrow: 0,
            rowlimit: 10,
            filter: []
        };
        var queryItem = $.extend({}, defaultCfg, cfg);
        var resultsource = "&properties='SourceLevel:SSA,SourceName:"+queryItem.resultsource+"'"
        var querytext = "querytext='"+queryItem.querytext+"'";
        var selectproperties = "&selectproperties='"+queryItem.properties+"'";
        var sortlist = queryItem.sortlist.length>0 ? "&sortlist='"+queryItem.sortlist.join(',')+"'":"";
        var startrow = '&startrow=' + queryItem.startrow;
        var rowlimit = '&rowlimit=' + queryItem.rowlimit;
        var refinementfilters = "";
        if (queryItem.filter.length > 0) {
            var rf = $.map(queryItem.filter, function(m,n) { 
                return "\"L0|%230" + m.guid + "|\"";
            });
            refinementfilters += "&refinementfilters='RefinableString01:" + (rf.length > 1 ? "or" : "") + "(" + rf.join(',') + ")'";
        }

        var searchUrl = "/_api/search/query?" + querytext + selectproperties + sortlist + refinementfilters + rowlimit + startrow + resultsource + "&clienttype='ContentSearchRegular'";
        var template = kendo.template($(queryItem.template).length !== 0 ? $(queryItem.template).html() : 'template not found');

        return { 
            defaultCfg: defaultCfg,
            cfg: queryItem,
            url: searchUrl,
            template: template
        };
    });

    var _show_pinned = function(){
        var $RRItem = $('#RRPinned');
        if ($RRItem.length === 0) { return; }
        console.info('get pinned ...');

        var queryItem = $.extend({}, RRDataConfig.RRDefault, RRDataConfig[$RRItem.data().rrconfigid]);
        var template = kendo.template($(queryItem.template).html());
        var resultsource = "&properties='SourceLevel:SSA,SourceName:"+queryItem.resultsource+"'"
        var querytext = "querytext='"+queryItem.querytext+"'";
        var selectproperties = "&selectproperties='"+queryItem.properties+"'";
        var sortlist = queryItem.sortlist.length>0 ? "&sortlist='"+queryItem.sortlist.join(',')+"'":"";
        var refinementfilters = "";
        var filter = m_userprofile.RRIntranetJSON.filter;
        if (filter.length > 0) {
			var rf = $.map(filter, function(m,n) { return "\"L0|%230" + m.guid + "|\""; });
            refinementfilters += "&refinementfilters='RefinableString01:"+(rf.length>1?"or":"")+"(" + rf.join(',') + ")'";
        }
        var clienttype = "&clienttype='ContentSearchRegular'";
		var srch = {
            url: _spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'')+"/_api/search/query?" + querytext + selectproperties + sortlist + refinementfilters + clienttype + resultsource,
		};
        _get_search_result(srch)
            .then(function(r) {
                var results = [];
				var unpnnd = [];
                $.each(r.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results, function(n,row){ 
                    var result = _process_relevant_result(row.Cells.results);
                    if (m_userprofile.RRIntranetJSON.unpinneditems.indexOf(result.DocId) === -1) {
                        results.push(result);
                    } else {
                        unpnnd.push(result.DocId);
                    }
                });
                m_userprofile.RRIntranetJSON.unpinneditems = $.unique(unpnnd);
                console.info('... show pinned');
				$RRItem.html(template({items:results}));
            }, function(r) {
                console.error('show pinned error');
            });
    };

    var _show_current = function(clear){
        var $RRItem = $('#RRCurrent');
        if ($RRItem.length === 0) { return; }
        console.info('get current ...');
        
        var thisConfig = RRDataConfig[$RRItem.data().rrconfigid];
        if (!clear) {
            thisConfig.startrow += thisConfig.rowlimit;
        }
        var additional = "";
        $.each(m_userprofile.RRIntranetJSON.unpinneditems, function(n,m) {
            additional += ' OR WorkId:' + m;
        });
        thisConfig.querytext = additional || thisConfig.querytext;
        thisConfig.filter = m_userprofile.RRIntranetJSON.filter;
        
        var RRThisSearch = new RRSearch(thisConfig);
        RRLog(RRThisSearch);
        _get_search_result({url: _spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'')+RRThisSearch.url})
            .then(function(r) {
                if (r.d.query.PrimaryQueryResult.RelevantResults.RowCount < RRThisSearch.cfg.rowlimit) {
                    $('.append-button').hide();
                } else {
                    $('.append-button').show();
                }
                if (clear) {
                    $RRItem.find('.item:not(:first)').each(function(n,m) {$('.grid').isotope('remove',m).isotope('layout'); });
                }
                $.each(r.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results, function(n,row) {
                    var result = _process_relevant_result(row.Cells.results);
                    if (RRThisSearch.cfg.removepinned && result.RRPinnedOWSBOOL==='1' && new Date(result.RefinableDate01) > Date.now() && m_userprofile.RRIntranetJSON.unpinneditems.indexOf(result.DocId) === -1) {
                        // skip
                    } else {
                        var $item = $(RRThisSearch.template({item:result}));
                        $RRItem.append($item).isotope('appended', $item).isotope('layout');
                        if (result.RRYammerIdOWSTEXT!=='') {
                            showYammerSocial(result.RRYammerIdOWSTEXT);
                        }
                    }
                });
                console.info('... show current');
            }, function(r) {
                console.error('show current error');
            });
    };
    
    var _show_mycompany = function(){
        var $RRItem = $('#container');
        if ($RRItem.length === 0) { return; }

        console.info('get mycompany ...');
        var queryItem = $.extend({}, RRDataConfig.RRDefault, RRDataConfig[$RRItem.data().rrconfigid]);
        var template = kendo.template($(queryItem.template).html());
        var resultsource = "&properties='SourceLevel:SSA,SourceName:"+queryItem.resultsource+"'";
        var selectproperties = "&selectproperties='"+queryItem.properties+"'";
        var sortlist = queryItem.sortlist.length>0 ? "&sortlist='"+queryItem.sortlist.join(',')+"'":"";
        var refinementfilters = "";
        var filter = m_userprofile.RRIntranetJSON.filter;
        if (filter.length > 0) {
			var rf = $.map(filter, function(m,n) { return "\"L0|%230" + m.guid + "|\""; });
            refinementfilters += "&refinementfilters='RefinableString01:"+(rf.length>1?"or":"")+"(" + rf.join(',') + ")'";
        }
        var clienttype = "&clienttype='ContentSearchRegular'";
        RR_TermSet.getValueFromPropertyBag('rrcompany').then(function(r){
            var rrc = JSON.parse(r);
            var companyName = rrc.name || m_userprofile.RRMyCompany

            var isGenericPage = RRPageParam.cat !== undefined;
            if (RRPageInEditMode && isGenericPage) {
                $('.RR-edit-panel-generic').show();
                $('.RR-edit-panel-specific').hide();
            } else {
                $('.RR-edit-panel-specific').show();
                $('.RR-edit-panel-generic').hide();
            }
            var d1 = isGenericPage ? _get_current_page_params() : _get_current_page_fieldvalues();
            var d2 = RR_TermSet.getTermSetByNameAsTree(queryItem.termsetname);
            $.when(d1, d2).done(function (page, r) {
                var companyCategories = $.grep(r.tree.children,function(r){return r.name === companyName});
                var thisCategory = companyCategories[0];
                RRLog('company');
                RRLog(thisCategory);
                var breadcrumb = [{href:_spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'')+'/MyCompany', title:thisCategory.title}];
                var subcatguid = (page.RRMyCompanyCategoryRollup && page.RRMyCompanyCategoryRollup.TermGuid) || (page.RRMyCompanyCategory && page.RRMyCompanyCategory.TermGuid);
                var path = [];
                if (subcatguid !== null) {
                    thisCategory = findCategory(thisCategory, subcatguid, path);
                }
                if (isGenericPage) {
                    document.title = thisCategory && thisCategory.title;
                }
                if ($('.intro.line .ms-rtestate-field').text() === '') {
                    $('.intro.line .ms-rtestate-field').text(thisCategory.term.get_description());
                }
                RRLog('thisCategory');
                RRLog(thisCategory);
                while(p = path.pop()){
                    var href = path.length === 0 ? '' : _spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'')+'/MyCompanySub?cat='+p.TermName+'&catguid='+p.TermGuid
                    breadcrumb.push({href:href, title:p.TermName});
                }
                $.each(breadcrumb, function(n,m){
                    $('#RRBreadCrumb').append(m.href === '' ? m.title : '<a href="'+m.href+'">'+m.title+'</a>');
                });

//				var thisPromises = [];
//				var tempCategory = thisCategory;
//				var thisQuerytext = "querytext='0" + tempCategory.guid + "|" + tempCategory.name.replace(/'/g,"''") + "'";
//                var thisSrch = {
//                    url: _spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'')+"/_api/search/query?" + thisQuerytext + selectproperties + sortlist + refinementfilters + clienttype + resultsource + '&trimduplicates=false',
//                };
//                tempCategory.result = [];
//                tempCategory.order = 0;
//				
//                thisPromises.push(_get_category_search_result(tempCategory, thisSrch));
//				
//				$.when.apply($, thisPromises).done(function() {
//                    $.each(arguments, function(x, tempCategory){
//						if (RRPageInEditMode || tempCategory.result.length > -1) {
//							tempCategory.children = [];
//							var $item = $(template({item:tempCategory})).addClass("currentTerm");
//							$('#container').append($item).isotope('appended', $item).isotope({'layoutMode':'fitRows'}).isotope('layout');
//						}
//                    });
//                });
				
                var promises = [];
				
                $.each(thisCategory.children, function(n, category) {
                    var querytext = "querytext='0" + category.guid + "|" + category.name.replace(/'/g,"''") + "'";
                    var srch = {
                        url: _spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'')+"/_api/search/query?" + querytext + selectproperties + sortlist + refinementfilters + clienttype + resultsource + '&trimduplicates=false',
                    };
                    category.result = [];
                    category.order = n;
                    promises.push(_get_category_search_result(category, srch));
                });

                $.when.apply($, promises).done(function() {
                    $.each(arguments, function(x, category){
						if (RRPageInEditMode || category.result.length > -1) {
                        var $item = $(template({item:category}));
                        $('#container').append($item).isotope('appended', $item).isotope({'layoutMode':'fitRows'}).isotope('layout');
						}
                    });
                });
				
				
            });
        });
    };

    var _show_all_companies = function(){
        var $RRItem = $('#RROverview');
        if ($RRItem.length === 0) { return; }

        console.info('get all companies ...');
        var queryItem = $.extend({}, RRDataConfig.RRDefault, RRDataConfig[$RRItem.data().rrconfigid]);
        var template = kendo.template($(queryItem.template).html());
        $('#RROverview').append(template({}));
    };
    
    var findCategory = function(tree, subcatguid, path) {
        if (path === undefined) {
            path = [];
        }
        var category = {};
        var subcats = $.grep(tree.children,function(r){ 
            return r.guid === subcatguid;
        });
        if (subcats.length === 0) {
            $.each(tree.children, function(n, subcat) {
                var cat = findCategory(subcat, subcatguid, path);
                if (!$.isEmptyObject(cat)) {
                    category = cat;
                    path.push({TermName: subcat.name, TermGuid: subcat.guid});
                }
            });
        } else {
            category = subcats[0];
            path.push({TermName: category.name, TermGuid: category.guid});
        }
        return category;
    };

    var _get_current_page_params = function () {
        var deferred = $.Deferred();
        $('.page-header h1').text(unescape(RRPageParam.cat));
        deferred.resolve({RRMyCompanyCategory:{TermName:RRPageParam.cat,TermGuid:RRPageParam.catguid}});
        return deferred.promise();
    };
	
    var _get_category_search_result = function (category, srch) {
        var deferred = $.Deferred();
        RRLog('category search:');
        RRLog(category);
        RRLog(srch);
        _get_search_result(srch).then(function(r) {
            category.result = [];
            $.each(r.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results, function(n,row) {
                category.result.push(_process_relevant_result(row.Cells.results));
            });
            deferred.resolve(category);
        }, function(error){
            deferred.reject(error);
        });
        return deferred.promise();
    };
    
    var showMoreCurrent = function() {
        _show_current(false);
    };
    
    var showYammer = function() {
        if ($('#yammer').length === 0) { return; }
        console.info('showYammer ...');
		var template = kendo.template($('#yammer-template').html());
		$('#yammer-messages').html(template({message:RRResourcesText.current_connect_loading,items:[]}));
        yam.getLoginStatus(function(r) {
            if (r.authResponse) {
                yam.platform.request({
                    url: 'messages/my_feed.json',
                    method:'GET',
                    success: function(result){
                        var messages = $.grep(result.messages,function(e){return e.replied_to_id === null; });
                        var topmessages = $.map(messages.slice(0,3),function(m,n) {
                            var refs_sender = $.grep(result.references, function(ref){ return ref.id == m.sender_id; });
                            var refs_thread = $.grep(result.references, function(ref){ return ref.thread_starter_id == m.thread_id; });
                            return $.extend({}, m, {created: new Date(Date.parse(m.created_at)), sender: refs_sender[0], comments: refs_thread[0]});
                        });
                        $('#yammer-messages').html(template({message:RRResourcesText.current_connect_others,items:topmessages}));
                        console.info('... Yammer ready');
                    },
                    error: function(result){SP.UI.Notify.addNotification('Yammer error', false);}
                });
            } else {
                console.info('Yammer not yet authenticated, show login button ...');
				$('#yammer-messages').html('');
                //$('#yammer-messages').html(template({message:'<a href="'+RRCfg.yammer_url+'/dialog/oauth?display=popup&client_id='+RRCfg.yammer_client_id+'" target="_blank">please login to Yammer first</a>',items:[]}));
				$('#yammer-post-message').text(RRResourcesText.current_connect_connect_first);
				$('#yammer-messages').html('<p>&nbsp;</p>');
            }
        });
    };
    
    var showYammerComments = function(threadId) {
        if (threadId === undefined) { return; }
        console.info('showYammerComments ...');
        yam.getLoginStatus(function(r) {
            if (r.authResponse) {
                yam.platform.request({
                    url: 'messages/in_thread/'+threadId+'.json',
                    method:'GET',
                    success: function(result){
                        var messages = $.map(result.messages,function(m,n) {
                            var refs = $.grep(result.references, function(e){ return e.id == m.sender_id; });
                            return $.extend({}, m, {created: new Date(Date.parse(m.created_at)), sender: refs[0]});
                        });
                        var comments = $.grep(messages,function(e){return e.replied_to_id !== null; });
                        RRLog(comments);
                        var template = kendo.template($('#yammer-comments-template').html());
                        $('#RRYammerComments').html(template({comments:comments}));
                        console.info('... Yammer comments ready');
                    },
                    error: function(result){SP.UI.Notify.addNotification('Yammer error', false);}
                });
            } else {
                console.info('Yammer not yet authenticated, show login button ...');
                $('#yammer-login').html('<a href="'+RRCfg.yammer_url+'/dialog/oauth?display=popup&client_id='+RRCfg.yammer_client_id+'" target="_blank">enable Yammer</a>');
            }
        });
    };
    
    var showYammerSocial = function(threadId) {
        if (threadId === undefined) { return; }
        yam.getLoginStatus(function(r) {
            if (r.authResponse) {
                yam.platform.request({
                    url: 'messages/in_thread/'+threadId+'.json',
                    method:'GET',
                    success: function(result){
                        var messages = $.grep(result.messages,function(e){return e.replied_to_id === null; });
                        var comments = $.grep(result.messages,function(e){return e.replied_to_id !== null; });
                        $('#RRSocial'+threadId).html('<li><a href="javascript:;"><span>'+messages[0].liked_by.count+'</span> <i class="fi-like"></i></a></li><li><a href="javascript:;"><span>'+comments.length+'</span> <i class="fi-comments"></i></a></li>');
                    },
                    error: function(result){SP.UI.Notify.addNotification('Yammer error', false);}
                });
            }
        });
    };
    
    var postYammer = function(yammerData) {
        var deferred = $.Deferred();
        yam.getLoginStatus(function(r) {
            if (r.authResponse) {
                yam.platform.request({
                    url:'messages.json',
                    method:'POST',
                    data: yammerData,
                    success: function(result){
                        console.info('post on Yammer ok');
                        deferred.resolve(result);
                    },
                    error: function(result){ 
                        console.error('post on Yammer failed');
                        deferred.reject(result);
                    }
                });
            } else {
                console.warn('Yammer not yet authenticated');
                deferred.reject(r);
            }
        });
        return deferred.promise();
    };
    
    var postYammerNews = function(title, url) {
        $('#RRYammerEnableComments').fadeOut();
        postYammer({
            group_id: RRCfg.yammer_news_group_id,
            body: title+', '+url
        }).then(function(result) {
            SP.UI.Notify.addNotification('Posted on Yammer!', false);
            $('#RRYammerPost input').val(result.messages[0].thread_id);
            $('#RRYammerThreadLink').attr('href',RRCfg.yammer_url+'/#/Threads/show?threadId='+result.messages[0].thread_id).fadeIn();
        }, function(error) {
            RRLog(error);
            SP.UI.Notify.addNotification('Yammer post failed', false);
            $('#RRYammerEnableComments').fadeIn();
        });
    };

    var postYammerComment = function(postCommentButton) {
        var RRYammerCommentTextArea = $(postCommentButton).data().rryammercommenttextarea;
        var RRYammerThreadId = $(postCommentButton).data().rryammerthreadid;
        postYammer({
            group_id: RRCfg.yammer_news_group_id,
            body: $('#'+RRYammerCommentTextArea).val(),
            replied_to_id: RRYammerThreadId
        }).then(function(result) {
            SP.UI.Notify.addNotification('Posted on Yammer!', false);
            $('#'+RRYammerCommentTextArea).val('');
            showYammerComments(RRYammerThreadId);
        }, function(error) {
            RRLog(error);
            SP.UI.Notify.addNotification('Yammer post failed', false);
        });
    };
    
    var _show_yammer_panels = function() {
        if ($('#RRYammerThreadId').text() === '') {
            $('.RRYammerCommentsDisabled').fadeIn();
            $('#RRYammerEnableComments').show();
        } else {
            showYammerComments($('#RRYammerThreadId').text());
            $('.RRYammerCommentsEnabled').fadeIn();
            $('#RRYammerThreadLink').attr('href',RRCfg.yammer_url+'/#/Threads/show?threadId='+$('#RRYammerThreadId').text()).show();
        }
    };
    
    var yammerCommentsPanel = function() {
        
    };

    var revealItemAsync = function(item) {
        var itemdata = $(item).data();
        if ($('#' + itemdata.open).length === 1) {
            (new Foundation.Reveal($('#' + itemdata.open))).open();
        } else {
            var RRThisCfg = RRDataConfig['RRCurrentReveal'];//$RRItem.data().rrconfigid];
            var queryItem = $.extend({}, RRDataConfig.RRDefault, RRThisCfg);
            var template = kendo.template($(queryItem.template).html());
            var querytext = "querytext="+queryItem.querytext.replace('{docid}',itemdata.docid);
            var selectproperties = "&selectproperties='"+queryItem.properties+"'";
            var srch = {
                url: _spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'')+"/_api/search/query?" + querytext + selectproperties
            };
            //RRLog(srch.url);
            _get_search_result(srch)
                .then(function(r) {
                    var results = r.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results;
                    RRLog(results);
                    var result = _process_relevant_result(results[0].Cells.results);
                    RRLog(result);
                    $('#RRModalReveal').append(template({item:result}));
                    if (result.RRYammerIdOWSTEXT !== undefined) {
                        showYammerComments(result.RRYammerIdOWSTEXT);
                    }
                    if (itemdata.pinned) {
                        m_userprofile.RRIntranetJSON.unpinneditems.push(result.DocId);
                        _update_user_profile_intranet_settings();
                        $('#'+itemdata.containerid).hide();
                    }
                    (new Foundation.Reveal($('#' + itemdata.open))).open();
                }, function(r) {
                    console.error('query workid failed');
                });
        }
        return false;
    };
    
    var companyCodes = function(){
        return m_companycodes;
    };
    
    var userProfile = function() {
        return m_userprofile;
    };

	var _filter_change = function() {
		console.info('change filter');
        $(".cssload-jumping-container").show();
        setTimeout(function(){
            $(".cssload-jumping-container").hide();
        }, 500);
        _set_company_filter();
        _show_pinned();
        _show_current(true);
        _update_user_profile_intranet_settings();
	};
    
    var _set_company_filter = function() {
		console.info('set company filter');
        if ($('#filterpanel').length===1) {
            if ($('#filterpanel input:not(:checked)').length === 0) {
                m_userprofile.RRIntranetJSON.filter = [];
            } else {
                m_userprofile.RRIntranetJSON.filter = $.map($('#filterpanel input:checked'), function(m,n) { return {guid: m.value, name: $(m).data().name}; });
                m_userprofile.RRIntranetJSON.filter.push({guid: m_companycodes.default.guid, name: m_companycodes.default.name});
            }
        } else if ($('#RRCompaniesFieldValue').length===1) {
            // company specific page? check the company field
            m_userprofile.RRIntranetJSON.filter = $.map($('#RRCompaniesFieldValue').text().split('; '),function(r) { return m_companycodes.names[r]; });
            m_userprofile.RRIntranetJSON.filter.push({guid: m_companycodes.default.guid, name: m_companycodes.default.name});
        }
		RRLog(m_userprofile.RRIntranetJSON.filter);
    };
    
    var _create_filter_panel = function(){
		if ($('#filterpanel').length === 0) { return; }
        console.info('create filterpanel');
        var template = kendo.template($('#filterpanel-template').html());
        var items = [];
        $.map(m_companycodes.guids, function(m,n) {
            if (!m.isgroup && m.isavailable) {
                m.ischecked = (m_userprofile.RRIntranetJSON.filter.length === 0 || $.grep(m_userprofile.RRIntranetJSON.filter,function(e){return e.guid === n;}).length > 0) ? true : false;
                items.push(m);
            }
        });
        $('#filterpanel fieldset').html(template({ items: items }));
        $('#filterpanel input').on('change', function() { _filter_change(); });
    };
	
    var _parse_companies = function(companies) {
		console.info('parse companies');
        var parsed_companies = {
            default: m_companycodes.default,
            guids:{},
            names:{}
        };
        //var lastmodifieddate = new Date(m_companycodes.lastmod) || new Date("2016-01-01");
		$.each(companies, function(n,m) {
			var name = m[RRCfg.companyNameNoteFldId].split('|')[0];
            //if (new Date(m.Modified) > lastmodifieddate) {
            //    lastmodifieddate = new Date(m.Modified);
            //}
            if (m.RRBusinessName === parsed_companies.default.businessname) {
                parsed_companies.default.guid = m.RRCompanyName.TermGuid;
            }
			parsed_companies.guids[m.RRCompanyName.TermGuid] = parsed_companies.names[name] = {
				guid: m.RRCompanyName.TermGuid,
				name: name,
				businessname: m.RRBusinessName,
				code: m.RRCompanyCode,
				isgroup: m.RRIsCompanyGroup,
                isavailable: RRCfg.availableCompanies.indexOf(m.RRBusinessName) > -1
			};
		});
        //parsed_companies.lastmod = lastmodifieddate.toJSON();
        return parsed_companies;
    };
	
    var _set_companycodes = function(cc, companyGuid) {
        m_companycodes = cc;
        console.info('set_companycodes ...');
        var companyGroup;
        if (companyGuid !== undefined) {
             companyGroup = m_companycodes.guids[companyGuid]
        } else if ($('#RRCompanyGroupNameFieldValue').length === 1) {
            companyGroup = m_companycodes.names[$('#RRCompanyGroupNameFieldValue').text()];
        } else if ($('#RRCompanyNameFieldValue').length === 1) {
            companyGroup = m_companycodes.names[$('#RRCompanyNameFieldValue').text()];
        }
        console.info(companyGroup);
        $('.RRGROUP').addClass(companyGroup && companyGroup.businessname || '');
        
		$.each(m_companycodes_temp, function(n,m) {
            $('.'+m.guid).addClass(m_companycodes.guids[m.guid].businessname);
        });
        _create_filter_panel();
        if (m_userprofile.RRMyCompany !== '') {
            $('#rrmycompanylogo').addClass(m_companycodes.names[m_userprofile.RRMyCompany].businessname);
        }
    };

    var _show_company_locations = function() {
		console.info('get company locations ...');
		var locationTemplate = kendo.template($('#company-profile-locations').html());

        var resultsource = "&properties='SourceLevel:SSA'";
        var querytext = "querytext='ContentTypeId:0x0100F5F28A5780C18241A53E4BB2FB6C5863*'";
        var properties = ['Title','HomeAddressStreetOWSTEXT','HomeAddressPostalCodeOWSTEXT','HomeAddressCityOWSTEXT','HomeAddressCountryOWSTEXT','CompanyNumberOWSTEXT','WorkFaxOWSTEXT','WorkEmail','WebPageOWSURLH','RefinableString01','owstaxIdRRCompanyName','RROrderOWSNMBR','RRGoogleMapsLinkOWSMTXT'];
        var selectproperties = "&selectproperties='"+properties.join(',')+"'";
        //var sortproperties = ['RROrderOWSNMBR:ascending'];
        var sortlist = "";//sortproperties.length>0 ? "&sortlist='"+sortproperties.join(',')+"'":"";
        //var refinementfilters = "&refinementfilters='RefinableString01:\"L0|%230"+companyGuid+"|\"'";
        var refinementfilters = "";
        //var rf = $.map(companyGuids, function(m,n) { return "\"L0|%230"+m+"|\""; });
        //refinementfilters += "&refinementfilters='RefinableString01:"+(rf.length>1?"or":"")+"(" + rf.join(',') + ")'";
        var filter = m_userprofile.RRIntranetJSON.filter;
        RRLog(filter);
        if (filter.length > 0) {
			var rf = $.map(filter, function(m,n) { return "\"L0|%230" + m.guid + "|\""; });
            refinementfilters += "&refinementfilters='RefinableString01:"+(rf.length>1?"or":"")+"(" + rf.join(',') + ")'";
        }
        //var refiners = "&refiners='RefinableString01'";
        var clienttype = "&clienttype='ContentSearchRegular'";
		var srch = {
            url: _spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'')+"/_api/search/query?" + querytext + selectproperties + sortlist + refinementfilters + clienttype + resultsource
		};
        RRLog(srch);
        _get_search_result(srch)
            .then(function(r) {
                var results = [];
                $.each(r.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results, function(n,row){ 
                    var result = _process_relevant_result(row.Cells.results);
                    results.push(result);
                });
                //_process_refinement_results(r.d.query.PrimaryQueryResult.RefinementResults);
                results = results.sort(function(a,b) { return a.RROrderOWSNMBR - b.RROrderOWSNMBR; });
                console.info('... _show_company_locations');
                if (results.length>0) {
                    $('#RRCompanyLocations').html(locationTemplate({items:results}));
                    new Foundation.Accordion($('#RRCompanyLocations'),{multiExpand: true, allowAllClosed: true});
                } else {
                    $('#RRCompanyLocations').html('<p><i>' + RRResourcesText.companyprofile_no_locations + '</i></p>');
                }
            }, function(r) {
                console.error('_show_company_locations error');
            });
    };

    var _show_company_events = function() {
        var queryDefaultItem = {resultsource:'SSA|Local SharePoint Results',querytext:'*',sortlist:[],template:''};
        var queryItem = $.extend(queryDefaultItem,$('[data-RRCompanyEvents]').data().rrcompanyevents);
		console.info('get company events ...');
		var eventTemplate = kendo.template($(queryItem.template).html());
        var resultsource = "&properties='SourceLevel:SSA,SourceName:"+queryItem.resultsource+"'";
        var querytext = "querytext='"+queryItem.querytext+"'";
        var properties = ['Title','Location','EventDateOWSDATE','RefinableDate02','EndDateOWSDATE','RefinableString01','owstaxIdRRCompanyName','fAllDayEvent','DocId'];
        var selectproperties = "&selectproperties='"+properties.join(',')+"'";
        var sortlist = "";
        var refinementfilters = "";
        var filter = m_userprofile.RRIntranetJSON.filter;
        if (filter.length > 0) {
			var rf = $.map(filter, function(m,n) { return "\"L0|%230" + m.guid + "|\""; });
            refinementfilters += "&refinementfilters='RefinableString01:"+(rf.length>1?"or":"")+"(" + rf.join(',') + ")'";
        }
        var rowlimit = '&rowlimit=' + m_event_rowlimit;
        var clienttype = "&clienttype='ContentSearchRegular'";
		var srch = {
            url: _spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'')+"/_api/search/query?" + querytext + selectproperties + sortlist + refinementfilters + rowlimit + clienttype + resultsource
		};
        RRLog(srch);
        _get_search_result(srch)
            .then(function(r) {
                var results = [];
                $.each(r.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results, function(n,row){ 
                    var result = _process_relevant_result(row.Cells.results);
                    results.push(result);
                });
                console.info('... _show_company_events');
                if (results.length>0) {
                    $('#RRCompanyEvents').html(eventTemplate({items:results}));
                } else {
                    $('#RRCompanyEvents').html('<p><i>'+ RRResourcesText.companyprofile_no_events + '</i></p>');
                }
            }, function(r) {
                console.error('_show_company_events error');
            });
    };
    
    var _show_company_images = function() {
		console.info('get company images ...');
		var eventTemplate = kendo.template($('#company-profile-images').html());
        var resultsource = "&properties='SourceLevel:SSA'";
        var querytext = "querytext='ContentTypeId:0x0101009148F5A04DDD49CBA7127AADA5FB792B00AADE34325A8B49CDA8BB4DB53328F21400E51398F51D4C6B4BAB013545D109E0EA*'";
        var properties = ['Title','PictureThumbnailURL','PictureURL',];
        var selectproperties = "&selectproperties='"+properties.join(',')+"'";
        var sortproperties = ['LastModifiedTime:descending'];
        var sortlist = sortproperties.length>0 ? "&sortlist='"+sortproperties.join(',')+"'":"";
        var refinementfilters = "";
        var filter = m_userprofile.RRIntranetJSON.filter;
        if (filter.length > 0) {
			var rf = $.map(filter, function(m,n) { return "\"L0|%230" + m.guid + "|\""; });
            refinementfilters += "&refinementfilters='RefinableString01:"+(rf.length>1?"or":"")+"(" + rf.join(',') + ")'";
        }
        var clienttype = "&clienttype='ContentSearchRegular'";
		var srch = {
            url: _spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'')+"/_api/search/query?" + querytext + selectproperties + sortlist + refinementfilters + clienttype + resultsource
		};
        _get_search_result(srch)
            .then(function(r) {
                var results = [];
                $.each(r.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results, function(n,row){ 
                    var result = _process_relevant_result(row.Cells.results);
                    results.push(result);
                });
                console.info('... _show_company_images');
				$('#RRCompanyImages').html(eventTemplate({items:results}));
                $('.html5lightbox').html5lightbox();
            }, function(r) {
                console.error('_show_company_images error');
            });
    };
    
    var _show_companies = function() {
		var companiesTemplate = kendo.template($('#company-tags').html());
        var companies = $('#RRCompaniesFieldValue').text().split('; ');
        $('#RRCompanies').html(companiesTemplate({items:companies}));
    };
    
    var _show_event_details = function() {
		console.info('get event ...');
        var RRThisCfg = RRDataConfig['RREvent'];
        var queryItem = $.extend({}, RRDataConfig.RRDefault, RRThisCfg);
        var template = kendo.template($(queryItem.template).html());
        var resultsource = "";
        var querytext = "querytext="+queryItem.querytext.replace('{docid}',RRPageParam.eventWorkId);
        var selectproperties = "&selectproperties='"+queryItem.properties+"'";
        var sortlist = "";
        var refinementfilters = "";
        var rowlimit = '&rowlimit='+queryItem.rowlimit;
        var clienttype = "&clienttype='ContentSearchRegular'";
		var srch = {
            url: _spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'')+"/_api/search/query?" + querytext + selectproperties + sortlist + refinementfilters + rowlimit + clienttype + resultsource
		};
        _get_search_result(srch)
            .then(function(r) {
                var results = [];
                $.each(r.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results, function(n,row){ 
                    var result = _process_relevant_result(row.Cells.results);
                    results.push(result);
                });
                console.info('... _show_event');
console.info(results[0]);
                if (results.length === 1) {
                    $('#RREventDetails').html(template({item:results[0]}));
                } else {
                    $('#RREventDetails').html('<p><i>'+ RRResourcesText.companyprofile_no_events + '</i></p>');
                }
            }, function(r) {
                console.error('_show_company_events error');
            });
    };
    
    var _show_user_profile = function() {
		console.info('get userprofile ...');
		SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
			SP.SOD.executeFunc('userprofile', 'SP.UserProfiles.PeopleManager', function () {
                var template = kendo.template($('#user-profile').html());
                var clientContext = SP.ClientContext.get_current(), peopleManager = new SP.UserProfiles.PeopleManager(clientContext);
                var personProperties = peopleManager.getPropertiesFor('i:0#.f|membership|' + RRPageParam.user);
                clientContext.load(personProperties);
                clientContext.executeQueryAsync(function () { 
                    if (personProperties.isPropertyAvailable("AccountName")) {
                        var item = personProperties.get_userProfileProperties();
                        item.company = m_companycodes.names[item.RRMyCompany];
                        var delve = document.createElement('a');
                        delve.href = personProperties.get_userUrl();
                        item.delveurl = delve.protocol + '//' + delve.hostname + '/_layouts/15/me.aspx?u=' + item['msOnline-ObjectId']
                        var wd=item['SPS-WorkDays'], d=[];
                        if(wd&32){d.push(moment('2001-01-01').locale(_spPageContextInfo.currentUICultureName).format('dddd'));}
                        if(wd&16){d.push(moment('2001-01-02').locale(_spPageContextInfo.currentUICultureName).format('dddd'));}
                        if(wd&8){d.push(moment('2001-01-03').locale(_spPageContextInfo.currentUICultureName).format('dddd'));}
                        if(wd&4){d.push(moment('2001-01-04').locale(_spPageContextInfo.currentUICultureName).format('dddd'));}
                        if(wd&2){d.push(moment('2001-01-05').locale(_spPageContextInfo.currentUICultureName).format('dddd'));}
                        if(wd&1){d.push(moment('2001-01-06').locale(_spPageContextInfo.currentUICultureName).format('dddd'));}
                        if(wd&64){d.push(moment('2001-01-07').locale(_spPageContextInfo.currentUICultureName).format('dddd'));}
                        item['workdays'] = d.join(', ');
						item.RRExpertise += (item.RRExpertise != "" && item['SPS-Skills'] != "") ? "|" : "" + item['SPS-Skills'];
                        $('#RRUserProfile').html(template({item:item}));
                    } else {
                        console.warn('person properties not instantiated for user: ' + RRPageParam.user);
                        $('#RRUserProfile').html('<p><i>'+ RRResourcesText.userprofile_not_found + '</i></p>');
                    }
                }, function(r) {
                    console.error('_show_user_profile error');
                });
            });
        });
    };
    
    var _show_tagged_content = function() {
        var tags = $('#RRTags').text();
        $('[data-RRTaggedContent]').each(function(x,taggedcontent){
            var $RRItem = $(taggedcontent);
            var queryItem = $.extend({}, RRDataConfig.RRDefault, RRDataConfig[$RRItem.data().rrconfigid]);
            console.info('get tagged content ' + queryItem.resultsource + '...');
            var template = kendo.template($(queryItem.template).html());
            var resultsource = "&properties='SourceLevel:SSA,SourceName:"+queryItem.resultsource+"'";
            var querytext = "querytext='"+tags.replace('; ',' OR ')+"'";
            var selectproperties = "&selectproperties='"+queryItem.properties+",ListID,ListItemID'";
            var sortlist = "";
            var refinementfilters = "";
            var filter = m_userprofile.RRIntranetJSON.filter;
            if (filter.length > 0) {
                var rf = $.map(filter, function(m,n) { return "\"L0|%230" + m.guid + "|\""; });
                refinementfilters += "&refinementfilters='RefinableString01:"+(rf.length>1?"or":"")+"(" + rf.join(',') + ")'";
            }
            var rowlimit = '';
            var clienttype = "&clienttype='ContentSearchRegular'";
            var srch = {
                url: _spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'')+"/_api/search/query?" + querytext + selectproperties + sortlist + refinementfilters + rowlimit + clienttype + resultsource
            };
            RRLog(srch);
            if (typeof(RRPageInEditMode)==="undefined" || !RRPageInEditMode) {
            _get_search_result(srch)
                .then(function(r) {
                    var results = [];
                    $.each(r.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results, function(n,row){ 
                        var result = _process_relevant_result(row.Cells.results);
                        if (result.ListID.toLowerCase() !==  _spPageContextInfo.pageListId.replace(/[{}]/g,'').toLowerCase() && result.ListItemID !== _spPageContextInfo.pageItemId) {
                            results.push(result);
                        }
                    });
                    console.info('... show tagged content ' + queryItem.resultsource);
                    RRLog(results);
                    $RRItem.html(template({items:results}));
                }, function(r) {
                    console.error('show tagged contents error');
                });
            } else {
                $RRItem.html(template({items:[]}));
            }

        });
    };
    
    var _show_vacancies = function(showType) {
        /*
        parameter showType = 'RRShowType'
        
        <div id="RRShowType" data-RRConfigId="RRShowType"></div>
         */
        showType = 'RRVacancies';
        var $RRItem = $('#' + showType);
        if ($RRItem.length === 0) { return; }

        console.info('get ' + showType + ' ...');
        var queryItem = $.extend({}, RRDataConfig.RRDefault, RRDataConfig[$RRItem.data().rrconfigid]);
        var template = kendo.template($(queryItem.template).html());
        var resultsource = "&properties='SourceLevel:SSA,SourceName:"+queryItem.resultsource+"'"
        var querytext = "querytext='"+queryItem.querytext+"'";
        var selectproperties = "&selectproperties='"+queryItem.properties+"'";
        var sortlist = queryItem.sortlist.length>0 ? "&sortlist='"+queryItem.sortlist.join(',')+"'":"";
        var refinementfilters = "";
        var filter = m_userprofile.RRIntranetJSON.filter;
        if (filter.length > 0) {
			var rf = $.map(filter, function(m,n) { return "\"L0|%230" + m.guid + "|\""; });
            refinementfilters += "&refinementfilters='RefinableString01:"+(rf.length>1?"or":"")+"(" + rf.join(',') + ")'";
        }
        var clienttype = "&clienttype='ContentSearchRegular'";
		var srch = {
            url: _spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'')+"/_api/search/query?" + querytext + selectproperties + sortlist + refinementfilters + clienttype + resultsource,
		};

        /*
        $configItem = $('[data-' + showType + ']');
        $placeholder = $('#' + showType);
        var queryDefaultItem = {resultsource:'SSA|Local SharePoint Results',querytext:'*',sortlist:[],template:''};
        var queryItem = $.extend(queryDefaultItem,$configItem.data()[showType.toLowerCase()]);
        var template = kendo.template($(queryItem.template).html());
        var resultsource = "&properties='SourceLevel:SSA,SourceName:"+queryItem.resultsource+"'"
        var querytext = "querytext='"+queryItem.querytext+"'";
        var selectproperties = "&selectproperties='"+queryItem.properties+"'";
        var sortlist = queryItem.sortlist.length>0 ? "&sortlist='"+queryItem.sortlist.join(',')+"'":"";
        var refinementfilters = "";
        var clienttype = "&clienttype='ContentSearchRegular'";
		var srch = {
            url: _spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'')+"/_api/search/query?" + querytext + selectproperties + sortlist + refinementfilters + clienttype + resultsource,
		};
        */
        _get_search_result(srch)
            .then(function(r) {
                var results = [];
                $.each(r.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results, function(n,row){ 
                    results.push(_process_relevant_result(row.Cells.results));
                });
                console.info('...  show ' + showType);
				$RRItem.html(template({items:results}));
            }, function(r) {
                console.error('error show ' + showType);
            });
    };
    
    var findColleagues = function() {
        console.info('find colleagues ...');
		var srch = {
            url: _spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'')+"/_api/search/query?querytext='*'&rowlimit=1&selectproperties='Title%2cRefinableString02'&refiners='RefinableString02'&clienttype='ContentSearchRegular'&properties='SourceLevel:SSA,SourceName:Local People Results'"
		};
        _get_search_result(srch)
            .then(function(r) {
                _process_refinement_results(r.d.query.PrimaryQueryResult.RefinementResults);
                var filter = $.map($('#RRCompaniesFieldValue').text().split('; '),function(r) { return m_companycodes.names[r]; });
                var tokens = $.map(m_refiners['RefinableString02'],function(r) { 
                    if($.grep(filter, function(e){ return e.name === r.name; }).length === 1) { return r.token; }
                });
                var rf = {
                    k: '*',
                    r: [{
                        n: 'RefinableString02',
                        t: tokens,
                        o: 'or',
                        k: false,
                        m: null
                }]};
                RRLog(m_refiners);
                RRLog(JSON.stringify(rf));
                console.info('... find colleagues ...');
                //m_userprofile.RRIntranetJSON.filter
                location.href=_spPageContextInfo.siteServerRelativeUrl.replace(/\/$/,'')+'/Colleagues#Default=' + JSON.stringify(rf);
            }, function(r) {
                console.error('find colleagues error');
            });
    };
    
    var findTagged = function(tag) {
        /*
SharePoint: ǂǂ4c307c233038356137303432342d623530662d346661372d613234662d3037346430653438633937637c5368617265506f696e74

Tags: SharePoint
rest
https://orangehill.sharepoint.com/_api/search/query?querytext='*'&selectproperties='Title%2cRefinableString03%2cTag'&refiners='Tags%2cRefinableString03'&refinementfilters='Tags:SharePoint'&clienttype='ContentSearchRegular'
webpart
https://orangehill.sharepoint.com/sites/reesinkdev/Pages/Results.aspx#Default=%7B%22k%22%3A%22*%22%2C%22r%22%3A%5B%7B%22n%22%3A%22Tags%22%2C%22t%22%3A%5B%22%5C%22%C7%82%C7%824c307c233038356137303432342d623530662d346661372d613234662d3037346430653438633937637c5368617265506f696e74%5C%22%22%5D%2C%22o%22%3A%22and%22%2C%22k%22%3Afalse%2C%22m%22%3Anull%7D%5D%7D
{"k":"*","r":[{"n":"Tags","t":["\"ǂǂ4c307c233038356137303432342d623530662d346661372d613234662d3037346430653438633937637c5368617265506f696e74\""],"o":"and","k":false,"m":null}]}
https://orangehill.sharepoint.com/sites/reesinkdev/Pages/Results.aspx#Default={"k":"*","r":[{"n":"Tags","t":["\"ǂǂ4c307c233038356137303432342d623530662d346661372d613234662d3037346430653438633937637c5368617265506f696e74\""],"o":"and","k":false,"m":null}]}


RRTag / RefinableString03: SharePoint
rest
https://orangehill.sharepoint.com/_api/search/query?querytext='*'&selectproperties='Title%2cRefinableString03%2cTag'&refiners='Tag%2cRefinableString03'&refinementfilters='RefinableString03:SharePoint'&clienttype='ContentSearchRegular'
webpart
https://orangehill.sharepoint.com/sites/reesinkdev/Pages/Results.aspx#Default=%7B%22k%22%3A%22*%22%2C%22r%22%3A%5B%7B%22n%22%3A%22RefinableString03%22%2C%22t%22%3A%5B%22%5C%22%C7%82%C7%824c307c233038356137303432342d623530662d346661372d613234662d3037346430653438633937637c5368617265506f696e74%5C%22%22%5D%2C%22o%22%3A%22and%22%2C%22k%22%3Afalse%2C%22m%22%3Anull%7D%5D%7D
{"k":"*","r":[{"n":"RefinableString03","t":["\"ǂǂ4c307c233038356137303432342d623530662d346661372d613234662d3037346430653438633937637c5368617265506f696e74\""],"o":"and","k":false,"m":null}]}
https://orangehill.sharepoint.com/sites/reesinkdev/Pages/Results.aspx#Default={"k":"*","r":[{"n":"RefinableString03","t":["\"ǂǂ4c307c233038356137303432342d623530662d346661372d613234662d3037346430653438633937637c5368617265506f696e74\""],"o":"and","k":false,"m":null}]}


https://orangehill.sharepoint.com/_api/search/query?querytext='*'&rowlimit=1&selectproperties='Tag'&refiners='Tags'&refinementfilters='RefinableString03:"SharePoint"'&clienttype='ContentSearchRegular'
        */
        console.info(' find tagged ...');
        var refiner = 'Tags';
		var srch = {
            url: _spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'')+"/_api/search/query?querytext='*'&rowlimit=1&selectproperties='"+refiner+"'&refiners='"+refiner+"'&refinementfilters='RefinableString03:\"" + tag + "\"'&clienttype='ContentSearchRegular'"
		};
        _get_search_result(srch)
            .then(function(r) {
                _process_refinement_results(r.d.query.PrimaryQueryResult.RefinementResults);
				var tokens = $.map(m_refiners['Tags'],function(r){
					if(r.name === tag){
						return r.token;
					}
				});
                var rf = {
                    k: '*',
                    r: [{
                        n:refiner,
                        t:tokens,
                        o:'and',
                        k:false,
                        m:null
                }]};
                //console.log(m_refiners);
                console.info('... find tagged');
                location.href=_spPageContextInfo.siteServerRelativeUrl.replace(/\/$/,'')+'/pages/Results.aspx#Default=' + JSON.stringify(rf);
            }, function(r) {
                console.error('find tagged error');
            });
    };
	
	var _show_tags = function() {
		$('[data-RRTags]').each(function(n,m){
			var taglinks = [];
			$.each($(m).find("#RRTags").text().split('; '), function(x,tag) {
				if(tag != ""){
					taglinks.push('<a href="javascript:RRDataModule.findTagged(\''+tag+'\');">'+tag+'</a>');
				}
			});
			//$(m).text($(m).text().split('; ').join(', '));
			var RRCompanyName = $(m).find("#RRCompany").text().trim();
			
			if(RRCompanyName.length == 0 && taglinks.length == 0){
				$(m).find("i").hide();
			} else if (RRCompanyName.length > 0 && taglinks.length > 0) {
				RRCompanyName += ", ";
			}
			$(m).find("#RRCompany").text(RRCompanyName);
			$(m).find("#RRTags").html(taglinks.join(', '));
		});
	};
    
    var findUser = function(query) {
        location.href = _spPageContextInfo.siteServerRelativeUrl.replace(/\/$/,'')+'/pages/Colleagues.aspx#k=' + query;
    };
    
    var findEvents = function() {
        location.href = location.href.replace('Profiles','Profiles/Events');
    };
    
    var _load_companies = function() {
        var deferred = $.Deferred();
        if (window.localStorage) {
            var ls_companycodes = localStorage.getItem(RRCfg.localstorage.RRCompanies.name);
            if (ls_companycodes !== null) {
                console.info('got companies from localstorage');
                _set_companycodes(JSON.parse(ls_companycodes));
                deferred.resolve();
            } else {
                console.info('no companies from localstorage');
            }
        }
        
        // get companies from SP for possible updates
        if (m_companycodes.lastmodifieddate === null || m_companycodes.lastmodifieddate === undefined) { m_companycodes.lastmodifieddate = new Date().toJSON(); }
		_check_updated_companies_from_sp(m_companycodes.lastmodifieddate)
			.then(function(check) {
                console.info('companies list: ' + check.length + ', cached: ' + m_companycodes.lastmodifieddate);
				//if (m_companycodes.lastmodifieddate === undefined || (moment(check) > moment(m_companycodes.lastmodifieddate)) || m_companycodes.guids.length === 0) {
				if (check.length > 0 || m_companycodes.guids.length === 0) {
					console.info('update companies ...');
					//_get_companies_from_sp()
					//	.then(function(companies) {
                    $.when(_get_companies_from_sp(), _get_current_page_fieldvalues())
                        .done(function(companies, page) {
							var sp_companycodes = _parse_companies(companies);
							//sp_companycodes.lastmodifieddate = new Date(check);
							sp_companycodes.lastmodifieddate = new Date().toJSON();
							console.info('got page and companies from sp');
							console.info(companies);
							console.info(page);
							_set_companycodes(sp_companycodes, (page.RRCompanyGroupName && page.RRCompanyGroupName.TermGuid));
							deferred.resolve();
							if (window.localStorage) {
								localStorage.setItem(RRCfg.localstorage.RRCompanies.name, JSON.stringify(m_companycodes));
								console.info('companies stored in localstorage');
							}
						});
				}
			});
		/*
        $.when(_get_companies_from_sp()).done(function(companies) {
console.log('companies');
console.log(companies);
            var sp_companycodes = _parse_companies(companies);
            if (new Date(sp_companycodes.lastmod) > new Date(m_companycodes.lastmod) || m_companycodes.guids.length === 0) {
                console.info('got companies from sp');
                _set_companycodes(sp_companycodes);
                deferred.resolve();
                if (window.localStorage) {
                    localStorage.setItem(RRCfg.localstorage.RRCompanies.name, JSON.stringify(m_companycodes));
                    console.info('companies stored in localstorage');
                }
            }
        });
		*/
        return deferred.promise();
    };

	var _check_updated_companies_from_sp = function(datecheck) {
        console.info('check updated companies ... ' + datecheck);
        var deferred = $.Deferred();
		//_get_rest_data({url: _spPageContextInfo.siteServerRelativeUrl.replace(/\/$/,'') + "/_api/web/lists/GetByTitle('" + RRCfg.companiesListTitle + "')/LastItemModifiedDate"})
		_get_rest_data({url: _spPageContextInfo.siteServerRelativeUrl.replace(/\/$/,'') + "/_api/web/lists/GetByTitle('" + RRCfg.companiesListTitle + "')/items?$filter=Modified gt datetime'" + datecheck + "'"})
			.then(function (result) { 
                console.info('... checked updated companies');
				//deferred.resolve(result.d.LastItemModifiedDate); 
				deferred.resolve(result.d.results); 
			}, function (error) { 
				console.error('... check companies failed');
				deferred.reject(error); 
			});
        return deferred.promise();
	};
	
	var _get_companies_from_sp = function() {
        console.info('get companies ...');
        var deferred = $.Deferred();
		_get_rest_data({url: _spPageContextInfo.siteServerRelativeUrl.replace(/\/$/,'') + "/_api/web/lists/GetByTitle('" + RRCfg.companiesListTitle + "')/items?$select=" + RRCfg.companyNameNoteFldId + ",RRCompanyName,RRCompanyCode,RRBusinessName,RRIsCompanyGroup,Modified&$orderby=RRCompanyCode"})
			.then(function (result) { 
                console.info('... got companies');
				deferred.resolve(result.d.results); 
			}, function (error) { 
				console.error('... companies failed');
				deferred.reject(error); 
			});
        return deferred.promise();
	};
	
    var _get_search_result = function (obj) {
        var deferred = $.Deferred();
		_get_rest_data(obj)
			.then(function (result) { deferred.resolve(result); }, function (error) { deferred.reject(error); });
        return deferred.promise();
    };
    
    var _get_current_page_fieldvalues = function () {
        var deferred = $.Deferred();
		_get_rest_data({url: _spPageContextInfo.webServerRelativeUrl.replace(/\/$/,'')+'/_api/web/lists(\''+_spPageContextInfo.pageListId+'\')/items('+_spPageContextInfo.pageItemId+')'})
			.then(function (result) { 
                console.info('... page fieldvalues');
                console.info(result.d);
                deferred.resolve(result.d);
            }, function (error) {
                deferred.reject(error);
            });
        return deferred.promise();
    };

    var _get_rest_data = function (obj) {
        var deferred = $.Deferred();
        var ajaxObj = {
            type: 'GET',
            contentType: 'application/json',
            headers: { Accept: 'application/json; odata=verbose' },
            dataType: 'json',
            processData: false,
            success: function (result) { deferred.resolve(result); },
            error: function (error) { deferred.reject(error); }
        };
        $.extend(ajaxObj, obj);
        RRLog('_get_rest_data');
        RRLog(ajaxObj);
        $.ajax(ajaxObj);
        return deferred.promise();
    };

    var init = function() {
		//$.each($('[data-rrresource]'), function(n,m){ $(m).text(RRResourcesText[$(m).data().rrresource]); });
        _show_yammer_panels();
        if (typeof(RRPageInEditMode) !== 'undefined' && RRPageInEditMode) { 
            // exclude people pickers from spell check
            $("textarea[name*='UserField'").attr('excludeFromSpellCheck','true');
        }
        $.when(_get_my_userprofile(), _load_companies()).done(function(r1){ 
            m_userprofile.RRMyCompanyUrl = _spPageContextInfo.siteServerRelativeUrl.replace(/\/$/,'')+'/'+m_companycodes.names[m_userprofile.RRMyCompany].businessname+'/MyCompany';
            $('#RR_menu_mycompany a').attr('href',m_userprofile.RRMyCompanyUrl);
            if (m_userprofile.RRIsSpUser) { RRSuiteBar.show(); } else { RRSuiteBar.hide(); }
            _set_company_filter();
			_show_pinned();
			_show_current(true);
			_show_vacancies();
			_show_mycompany();
            _show_all_companies();
			if ($('[data-RRCompanyLocations]')[0] !== undefined) { _show_company_locations(); }
			if ($('[data-RRCompanyEvents]')[0] !== undefined) { _show_company_events(); }
            $('[data-RREventDetails]').each(function() { _show_event_details(); });
            $('[data-RRUserProfile]').each(function() { _show_user_profile(); });
			if ($('[data-RRCompanyImages]')[0] !== undefined) { _show_company_images(); }
            if ($('[data-company-image] img')[0] !== undefined) {
                var src = $('[data-company-image] img').attr('src'), caption = $('[data-company-image] .CompanyImageCaption').text();
                $('[data-company-image]').html('<a href="' + src + '" class="html5lightbox" data-group="reesink-group" title="' + caption + '"><img src="' + src + '" /></a>').show();
            }
            if ($('[data-company-video]').text() !== "") {
                $('[data-company-video]').html('<iframe width="640" height="488" frameborder="0" src="' + $('[data-company-video]').text() + '" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>').show();

            }
            if ($('#RRCompanyGroupPageUrlFieldValue a').text() !== "") {
                $('#RRCompanyGroupPageUrlFieldValue a').text($('#RRCompanyGroupNameFieldValue').hide().text());
                $('#RRCompanyGroupPageUrlFieldValue').show();
            }
            $('[data-RRProfilePic]').each(function(n,m){ 
                var userId = $(m).find('img.ms-hide').attr('sip');
                $(m).html('<img src="'+(userId === undefined ? _spPageContextInfo.siteServerRelativeUrl.replace(/\/$/,'')+'/siteassets/img/profile.png' : '/_vti_bin/DelveApi.ashx/people/profileimage?userId='+userId+'&size=L')+'" />');
            });
			$('[data-RRProfileLink]').each(function(n,m){ 
				var userId = $(m).find('img.ms-spimn-img').attr('sip');
				var profileLink = $(m).find('a.ms-subtleLink');
				profileLink.each(function(p,o){
					$(o).attr("href", _spPageContextInfo.siteServerRelativeUrl.replace(/\/$/, '') + '/userprofile?user=' + userId);
				});
			});
			_show_tags();
            _show_tagged_content();
			showYammer();
            if (m_companycodes.names.length > 0) {
                $('#rrmycompanylogo').addClass(m_companycodes.names[m_userprofile.RRMyCompany].businessname);
            }
        });
    };
    
    init();

    return {
        showMoreCurrent: showMoreCurrent,
        showYammer: showYammer,
        showYammerComments: showYammerComments,
        postYammerNews: postYammerNews,
        postYammerComment: postYammerComment,
        revealItemAsync: revealItemAsync,
        companyCodes: companyCodes,
        userProfile: userProfile,
        findColleagues: findColleagues,
		findTagged: findTagged,
        findUser: findUser,
        findEvents: findEvents,
        clearAll: clearAll,
		showAll: showAll
    };
})();

var ohPublishing = (function () {
	var m_itemid;
    var m_yam_thread_id, m_yam_post_fieldid = 'ohYamPost';
	
    var f_page_param = function () {
        cmParms = {};
        $.each(window.location.search.substr(1).split('&'), function (n, m) {
            cmParms[(m.split('=')[0])] = m.split('=')[1];
        });
        return cmParms;
    };

    var _post_ema_data = function (obj, data) {
        var deferred = $.Deferred();
        var ajaxObj = {
            type: 'POST',
            url: '',
            contentType: 'application/json',
            headers: { Accept: 'application/json; odata=verbose' },
            dataType: 'json',
            processData: false,
            data: JSON.stringify(data),
            success: function (result) { deferred.resolve(result); },
            error: function (error) { deferred.reject(error); }
        };
        $.extend(ajaxObj, obj);
        $.ajax(ajaxObj);
        return deferred.promise();
    };

    var put_ema_data = function (obj, data) {
        $.each(data, function (n, m) { if (typeof (m) === 'string') { data[n] = unescape(m); } });
        var deferred = $.Deferred();
        var ajaxObj = {
            type: 'PUT',
            url: '',
            contentType: 'application/json',
            processData: false,
            data: JSON.stringify(data),
            success: function (result) { deferred.resolve(result); },
            error: function (error) { deferred.reject(error); }
        };
        $.extend(ajaxObj, obj);
        $.ajax(ajaxObj);
        return deferred.promise();
    };

    var postEmaData = function (ajaxObj, data) {
        return _post_ema_data(ajaxObj, data)
            .then(function (result) {
                return result;
            }, function (err) {
                console.log(err);
                console.log(ajaxObj);
                console.log(data);
                return err;
            });
    };

    var getYammerData = function (threadId) {
        var deferred = $.Deferred();
        if (threadId === undefined) { 
            deferred.reject({});
        } else {
            var url = 'https://www.yammer.com/api/v1/messages/in_thread/' + threadId + '.json';
            $.ajax({
                type: 'GET',
                url: url,
                //headers: { "accept": "application/json;odata=verbose", "content-type": "application/json;odata=verbose",},
                success: function (result) { deferred.resolve(result); },
                error: function (error) { deferred.reject(error); }
            });
        }
        return deferred.promise();
    };

    // https://github.com/pavelk2/social-feed/blob/gh-pages/index.html
    var socialFeed = function(q) {
        var initialQuery = q || '@orangehill020, #orangehill020';//$('#query').val();
        initialQuery = initialQuery.replace(" ", "");
        var queryTags = initialQuery.split(",");
        $('#ohSocialFeed').socialfeed({
            // FACEBOOK
            facebook: {
                accounts: queryTags,
                limit: 5,
                access_token: '187528958290213|3cff23f26d3af4b6f649c6664618d19d' // from https://developers.facebook.com/apps/
            },
            // Twitter
            twitter: {
                accounts: queryTags,
                limit: 5,
                consumer_key: 'bGYPXu9iGBjmazraUsH6v1hT6', // make sure to have your app read-only https://apps.twitter.com/
                consumer_secret: '6Z5NBT1qnGu40BDlqTHJaTArIZmz29vYEnAJlT8hgMDZvRmqkE', // make sure to have your app read-only https://apps.twitter.com/
            },
            // GENERAL SETTINGS
            length: 200,
            template: "/sites/fmo/siteassets/socialfeed/template.html",
            show_media: false,
            //update_period: 5000,
            // When all the posts are collected and displayed - this function is evoked
            callback: function() {
                console.log('all posts are collected');
            }
        });
    };

    var getListItem = function (itemid, list, site) {
        var deferred = $.Deferred();
        var url = (site ? site.replace(/\/$/,'') : '') + '/_api/web/lists/getbytitle(\'' + list + '\')/items(' + itemid + ')/fieldvaluesashtml';
        //console.log(url);
        $.ajax({
            type: 'GET',
            url: url,
            headers: {
                "accept": "application/json;odata=verbose",
                "content-type": "application/json;odata=verbose",
            },
            success: function (result) { deferred.resolve(result); },
            error: function (error) { deferred.reject(error); }
        });
        return deferred.promise();
    };

    var updateListItem = function (itemid, updates, list, site) {
        //updates['__metadata'] = { 'type': 'SP.Data.SampleListItem' };
        var url = (site ? '/' + site : '') + '/_api/web/lists/getbytitle(\'' + list + '\')/items(' + itemid + ')';
        //console.log(url);
        updates['__metadata'] = { 'type': 'SP.Data.PagesItem' };
        var deferred = $.Deferred();
        $.ajax({
            type: 'POST',
            url: url,
            data: JSON.stringify(updates),
            headers: {
                "X-HTTP-Method": "MERGE",
                "accept": "application/json;odata=verbose",
                "content-type": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "IF-MATCH": "*"
            },
            success: function (result) { deferred.resolve(result); },
            error: function (error) { deferred.reject(error); }
        });
        return deferred.promise();
    };

    var checkoutItem = function(){
		/*
        if (document.forms['aspnetForm']['MSOLayout_InDesignMode'] != null) 
            document.forms['aspnetForm']['MSOLayout_InDesignMode'].value = 1;
        if (document.forms['aspnetForm']['MSOAuthoringConsole_FormContext'] != null) 
            document.forms['aspnetForm']['MSOAuthoringConsole_FormContext'].value = 1;
        if (document.forms['aspnetForm']['MSOSPWebPartManager_DisplayModeName'] != null) 
            document.forms['aspnetForm']['MSOSPWebPartManager_DisplayModeName'].value = 'Design';
        __doPostBack('ctl05','edit');
		*/
		$('#ohPublishingCheckOut').hide();
		SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
			SP.SOD.executeFunc('userprofile', 'SP.UserProfiles.PeopleManager', function () {
				var clientContext = SP.ClientContext.get_current();
				var webSite = clientContext.get_web();
				var list = webSite.get_lists().getByTitle("Pages");
				var item = list.getItemById(m_itemid);
				var file = item.get_file();
				file.checkOut();
				//file.undoCheckOut();
				//file.checkin();
				//file.publish();
				clientContext.load(file);
				clientContext.executeQueryAsync(function (){
					console.info('checked out');
					SP.UI.Notify.addNotification('checked out', false);
					$('#ohPublishingEdit').show();
				}, function (sender, args) {
					SP.UI.Notify.addNotification('checked out failed', false);
					console.error('Error: ' + args.get_message());
					$('#ohPublishingEdit').hide();
					$('#ohPublishingCheckOut').show();
				});
			});
		});
    };
    
    var editItem = function () {
        $('#ohPublishingEdit').hide();
        $('#ohPublishingSave').show();
        //$($('#ohContentField').data().kendoEditor.body).attr('contenteditable', true);
        $($('.ohEditPanel .ms-rtestate-field').data().kendoEditor.body).attr('contenteditable', true);

        SP.UI.Notify.addNotification('You can now edit the page', false);
    };

    var saveItem = function () {
        $('#ohPublishingSave').hide();
        //$($('#ohContentField').data().kendoEditor.body).attr('contenteditable', false)
        $($('.ohEditPanel .ms-rtestate-field').data().kendoEditor.body).attr('contenteditable', false);
        $($('#ctl00_PlaceHolderMain_PublishingPageContentRichHtmlField__ControlWrapper_RichHtmlField').data().kendoEditor.body).attr('contenteditable', false)
        var item = {};
        var listName = 'Pages';
        var id = $('#fmoPageId').text();
        item['PublishingPageContent'] = $('.ohEditPanel .ms-rtestate-field').data("kendoEditor").value();
        updateListItem(id, item, listName, 'sites/fmo')
            .then(function (r) {
                SP.UI.Notify.addNotification('Saved', false);
                $('#ohPublishingEdit').show();
                //__doPostBack();
            }, function (r) { 
                $('#ohPublishingSave').show();
                //$($('#ohContentField').data().kendoEditor.body).attr('contenteditable', true);
                $($('.ohEditPanel .ms-rtestate-field').data().kendoEditor.body).attr('contenteditable', true);
            });
    };
    
    var getYammerThread = function() {
        $('#ohYammerThread').html('');
        if (m_yam_thread_id === null || m_yam_thread_id === '') return;
        console.log('Yammer thread id: ' + m_yam_thread_id);
        yam.platform.request({
            url:'messages/in_thread/' + m_yam_thread_id + '.json',
            method:'GET',
            success: function(result){
                var threadref = $.grep(result.references, function(e){ return e.type === 'thread'; });
                $('#ohYammerThread').html('<div><a href="' + threadref[0].web_url + '" target="_blank">view Yammer conversation</a></div>');
                //console.log(result);
                var messages = $.map(result.messages,function(m,n) {
                    if (m.replied_to_id === null) {
                        return null;
                    } else {
                        var refs = $.grep(result.references, function(e){ return e.id === m.sender_id; });
                        return {created_at: new Date(Date.parse(m.created_at)), content_excerpt: m.content_excerpt, mugshot_url: refs[0].mugshot_url};
                    }
                });
                messages = messages.sort(function(a,b) { return a.created_at - b.created_at; });
                $.each(messages, function(n,m){
                    var comment = document.createElement('div');
                    $(comment).html('<img src="'+m.mugshot_url+'" />'+m.content_excerpt);
                    $('#ohYammerThread').append(comment);
                });
                var yampostField = document.createElement('input');
                yampostField.id = m_yam_post_fieldid;
                $('#ohYammerThread').append(yampostField);
                var yampostButton = document.createElement('a');
                yampostButton.href = 'javascript:;';
                yampostButton.text = 'post reply';
                yampostButton.addEventListener('click', function(){ doYammer(postYammerReply);return false; });
                $('#ohYammerThread').append(yampostButton);
            },
            error: function(result){SP.UI.Notify.addNotification('Yammer thread not found', false);}
        });
    };
    
    var postYammerReply = function() {
        yam.platform.request({
            url:'messages.json',
            method:'POST',
            data: { body: $('#'+m_yam_post_fieldid).val(), replied_to_id: m_yam_thread_id},
            success: function(result){
                //console.log(result);
                SP.UI.Notify.addNotification('Posted', false);
                getYammerThread();
            },
            error: function(result){ SP.UI.Notify.addNotification('Yammer thread not found', false); }
        });
        
    };
    
    var doYammer = function(yammerFunc) {
        //https://developer.yammer.com/docs/threadsidjson
        yam.getLoginStatus(function(r) {
            if (r.authResponse) {
                //console.log("logged in for thread");
                yammerFunc();
            } else {
                yam.connect.loginButton('#yammer-login', function (r) {
                    //console.log(r);
                    if (r.authResponse) {
                        //console.log("logged in by button");
                        $('#yammer-login').text('Welcome to Yammer!');
                        yammerFunc();
                    }
                });
            }
        });
    };

    //<div id="ohContentField" class="k-widget k-editor k-editor-inline" data-list="Sample" data-fieldname="SamoBodyText"></div>
    var init = function () {
        //var editpanels = [];
        //editpanels.push($('#ohContentField'));
        //editpanels.push($('#ctl00_PlaceHolderMain_PublishingPageContentRichHtmlField__ControlWrapper_RichHtmlField'));
        m_yam_thread_id = $('#ohYammerThreadId').text();
        $('#suiteBarToggleButton').kendoButton();//{click: function(e) { RRSuiteBar.toggle(); }});
        
        var isSPUser = RRSuiteBar.toggle();
        if (!isSPUser) {
            $('#ohPublishingPanel button').kendoButton();
            listName = 'Pages';
            //m_itemid = $('#fmoPageId').text();
            getListItem(_spPageContextInfo.pageItemId, listName, _spPageContextInfo.webServerRelativeUrl)
                .then(function (r) {
                    //console.log(r.d);
                    if (r.d.CheckoutUser === undefined || r.d.CheckoutUser === '') {
                        $('#ohPublishingCheckOut').show();
                    } else {
                        $('#ohPublishingEdit').show();
                    }
                    $('#ohContentField').hide();
                    if (false) {
                        var tools = $('#ohContentField').data('tools') && $('#ohContentField').data('tools').split('|');
                        tools.push({ name: "insertHtml", items: [
                            { text: "Signature", value: "<p>Regards,<br /> John Doe,<br /><a href='mailto:john.doe@example.com'>john.doe@example.com</a></p>" },
                            { text: "Kendo online demos", value: " <a href='//demos.telerik.com/kendo-ui'>Kendo online demos</a> " }
                        ]});
                        $('#ohContentField').kendoEditor({
                            value: r.d['PublishingPageContent'],
                            tools: tools
                        });
                        $($('#ohContentField').data().kendoEditor.body).attr('contenteditable', false)
                    }
                    {
                        $p = $('.ohEditPanel .ms-rtestate-field');
                        if ($p.length > 0) {
                            $p.css('display', 'block');
                            $p.kendoEditor();
                            $($p.data().kendoEditor.body).attr('contenteditable', false);
                            //$('#ctl00_PlaceHolderMain_PublishingPageContentRichHtmlField__ControlWrapper_RichHtmlField').kendoEditor();
                            //$($('#ctl00_PlaceHolderMain_PublishingPageContentRichHtmlField__ControlWrapper_RichHtmlField').data().kendoEditor.body).attr('contenteditable', false)
                        }
                    }
                    //});
                }, function (r) {
                    SP.UI.Notify.addNotification('not found', false);
                });
        }
        //https://developer.yammer.com/docs/js-sdk
        doYammer(getYammerThread);
    };

    return {
        init: init,
        socialFeed: socialFeed,
        checkoutItem: checkoutItem,
        editItem: editItem,
        getListItem: getListItem,
        saveItem: saveItem,
        updateListItem: updateListItem
    };
})();


(function() {
var resetUserProfileLinkSearch = function () {
  var searchProfileLinks = $('a[href*=\'PersonImmersive.aspx\']')
  searchProfileLinks.each(function (index) {
    var searchProfileLink = $(searchProfileLinks[index]) [0]
    var loginname = $(unescape($.grep(searchProfileLink.search.substr(1).split('&'), function (value) {
      return value.toLowerCase().indexOf('accountname') >= 0;
    }) [0].split('=') [1]).split('|')).last() [0];
    searchProfileLink.href = _spPageContextInfo.siteServerRelativeUrl.replace(/\/$/, '') + '/userprofile?user=' + loginname;
  });
}

if (typeof Srch !== "undefined" && typeof Srch.Result !== "undefined") {
    Srch.Result.prototype.originalRender = Srch.Result.prototype.render;
    Srch.Result.prototype.render = function() {
        // Do something before the refiner rendering
        console.log('This is logged before the rendering started');
 
        // Call the original render function
        this.originalRender();
 
        // Do something after the refiner rendering
		resetUserProfileLinkSearch()
        console.log('This is logged when rendering is completed');
    };      
}
})();
