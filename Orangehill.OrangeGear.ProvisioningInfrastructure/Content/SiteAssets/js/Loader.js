//RegisterSod('jquery-3.3.1.min.js', 'https://code.jquery.com/jquery-3.3.1.min.js');

if (typeof _spPageContextInfo !== 'undefined') {

    var ServerRelativeUrl = _spPageContextInfo.webServerRelativeUrl;
    var ServerRelativeUrlJS = ServerRelativeUrl + '/SiteAssets/js/';
    var ServerRelativeUrlCSS = ServerRelativeUrl + '/SiteAssets/css/';

    var headID = document.getElementsByTagName('head')[0];

    var JsFiles = [["jquery-3.1.1.min.js", "Jquery"], ["SP-Responsive-UI.js", "PnPResponsiveUI"], ["Orangehill.js", "Orangehill"]];

    JsFiles.forEach(function (JsFile, index) {
        var newScript = document.createElement('script');
        newScript.type = 'text/javascript';
        newScript.src = ServerRelativeUrlJS + JsFile[0];
        newScript.id = JsFile[1];
        headID.appendChild(newScript);
    });
    
    var CssFiles = [["SP-Responsive-UI.css", "PnPResponsiveUI"], ["Orangehill.css","Orangehill"]]; //,"SP-Responsive-UI-Custom.css"];

    CssFiles.forEach(function (CssFile, index) {
        var newStyle = document.createElement('link');
        newStyle.type = 'text/css';
        newStyle.rel = 'stylesheet';
        newStyle.href = ServerRelativeUrlCSS + CssFile[0];
        newStyle.id = CssFile[1]
        headID.appendChild(newStyle);
    });
    
}