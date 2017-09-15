var OrangehillGlobalNavigation = OrangehillGlobalNavigation || {};

var TermID = "";
var TermSetID = "";
var context;

var getNavigationTree = function (navTerm) {
    var deferred = $.Deferred();
    var tree = {
        term: navTerm.getTaxonomyTerm(),
        children: []
    };
    var terms = navTerm.get_terms();
    context.load(terms);
    context.executeQueryAsync(function () {
        for (var i = 0; i < terms.get_count(); i++) {
            var childTerm = terms.getItemAtIndex(i);
            //tree.children.push(getNavigationTree(childTerm));
            getNavigationTree(childTerm).then(function (result) {
                tree.children.push(result);
            });
        }
    });
    //return tree;
    deferred.resolve(tree);
    return deferred.promise();
}

var getNavigationTreeForTermSet = function (navTermSet) {
    var deferred = $.Deferred();
    var tree = {
        termSet: navTermSet,
        children: []
    };
    var terms = navTermSet.get_terms();
    context.load(terms);
    context.executeQueryAsync(function () {
        for (var i = 0; i < terms.get_count(); i++) {
            var childTerm = terms.getItemAtIndex(i);
            //tree.children.push(getNavigationTree(childTerm));
            getNavigationTree(childTerm).then(function (result) {
                tree.children.push(result);
            });
        }
    });
    //return tree;
    deferred.resolve(tree);
    return deferred.promise();
}

loadNavigationTermSet = function (navTermSetId, success, error) {
    //var context = SP.ClientContext.get_current();
    var taxonomySession = SP.Taxonomy.TaxonomySession.getTaxonomySession(context);

    var termStore = taxonomySession.getDefaultSiteCollectionTermStore(); //retrieve default Term Store
    var termSet = termStore.getTermSet(navTermSetId);
    var navTermSet = SP.Publishing.Navigation.NavigationTermSet.getAsResolvedByWeb(context, termSet, context.get_web(), "GlobalNavigationTaxonomyProvider");

    context.load(navTermSet, 'Terms');
    context.executeQueryAsync(function () {
        success(navTermSet);
    },
        error);
}

loadNavigationTerm = function (navTermSetId, navTermId, success, error) {
    //var context = SP.ClientContext.get_current();
    var taxonomySession = SP.Taxonomy.TaxonomySession.getTaxonomySession(context);

    var termStore = taxonomySession.getDefaultSiteCollectionTermStore(); //retrieve default Term Store
    var term = termStore.getTermInTermSet(navTermSetId, navTermId);
    var navTerm = SP.Publishing.Navigation.NavigationTerm.getAsResolvedByWeb(context, term, context.get_web(), "GlobalNavigationTaxonomyProvider");

    context.load(navTerm, 'Terms');
    context.executeQueryAsync(function () {
        success(navTerm);
    },
        error);
}

renderSubNavigation = function (item) {
    var listItem = $("<li/>");
    var link = $("<a/>");
    link.href = item.term.get_simpleLinkUrl();
    link.text(item.term.get_name());
    listItem.append(link);

    if (item.children.length > 0) {
        var childListItems = $("<ul/>");
        item.children.forEach(function (child, index) {
            var item = renderSubNavigation(child);
            childListItems.append(item);
        });
        listItem.append(childListItems)
    }
    return listItem
}

renderNavigation = function (item) {

    var tree = $("<ul/>");
    item.children.forEach(function (child, index) {
        var listItem = renderSubNavigation(child);
        tree.append(listItem);
    });

    $("#DeltaPlaceHolderMain").append(tree);
}

OrangehillGlobalNavigation.init = function () {
    if (!window.jQuery) {
        // jQuery is needed for PnP Responsive UI to run, and is not fully loaded yet, try later
        setTimeout(OrangehillGlobalNavigation.init, 100);
    } else {
        SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
            context = SP.ClientContext.get_current();
            SP.SOD.registerSod('sp.taxonomy.js', SP.Utilities.Utility.getLayoutsPageUrl('sp.taxonomy.js'));
            SP.SOD.executeFunc('sp.taxonomy.js', 'SP.Taxonomy.TaxonomySession', function () {
                SP.SOD.registerSod('sp.publishing.js', SP.Utilities.Utility.getLayoutsPageUrl('sp.publishing.js'));
                SP.SOD.executeFunc('sp.publishing.js', 'SP.Publishing.Navigation.NavigationTermSet', function () {

                    var navTermSetId = '48b8ad38-3813-4aef-a66b-1168c3a3626c';
                    var navTermId; // = '0b0962fe-6bf7-4c12-82b7-6025cdff5b17';
                    if (navTermId && navTermId !== "") {
                        loadNavigationTerm(navTermSetId, navTermId,
                            function (navTerm) {
                                //var tree = getNavigationTree(navTerm);
                                //OrangehillGlobalNavigation.renderNavigation(tree);
                                getNavigationTree(navTerm).then(function (tree) {
                                    renderNavigation(tree);
                                });
                            },
                            function (sender, args) {
                                console.log('Request failed ' + args.get_message() + ':' + args.get_stackTrace());
                            }
                        );
                    } else {
                        loadNavigationTermSet(navTermSetId,
                            function (navTermSet) {
                                //var tree = getNavigationTreeForTermSet(navTermSet);
                                //OrangehillGlobalNavigation.renderNavigation(tree);
                                getNavigationTreeForTermSet(navTermSet).then(function (tree) {
                                    renderNavigation(tree);
                                });

                            },
                            function (sender, args) {
                                console.log('Request failed ' + args.get_message() + ':' + args.get_stackTrace());
                            }
                        );
                    }
                });
            });
        });
    }
}

OrangehillGlobalNavigation.init();
