<html>
<head>
</head>
<body>
	<pre id="content">
		usage:
		generateresource.aspx?locales=&lt;locales&gt;&type=&lt;type&gt;&preview

		locales: nlNL | enUS | deDE | daDK | frFR | ruRU | trTR
		(select on or more locale, pipe separated)
		
		type: Text | [Provision]
		(client files (default) or provision files)
        
		preview
		(view only, files not generated)
		
        
		examples:
		# generate all text locale files
		generateresource.aspx?locales=nlNL|enUS|deDE|daDK|frFR|ruRU|trTR&type=Text
			=>	RRResources.nl-NL.js
				RRResources.en-US.js
				RRResources.de-DE.js
				RRResources.da-DK.js
				RRResources.fr-FR.js
				RRResources.ru-RU.js
				RRResources.tr-TR.js

		# generate all provision resource files
		generateresource.aspx?locales=nlNL|enUS|deDE|daDK|frFR|ruRU|trTR&type=Provision
			=>	Reesink.nl-NL.resx
				Reesink.en-US.resx
				Reesink.de-DE.resx
				Reesink.da-DK.resx
				Reesink.fr-FR.resx
				Reesink.ru-RU.resx
				Reesink.tr-TR.resx
	</pre>
    <script>
		//var _spPageContextInfo = { siteServerRelativeUrl: '/sites/reesinkdev/' };
		//var RRSiteRelUrl = _spPageContextInfo.siteServerRelativeUrl.replace(/\/$/,'');
		document.write(decodeURIComponent("%3Cscript src='../js/RRCfg.js' type='text/javascript'%3E%3C/script%3E"));
    </script>
    <script src='https://code.jquery.com/jquery-2.2.2.min.js' type='text/javascript'></script>
    <script src="https://kendo.cdn.telerik.com/2016.1.112/js/kendo.all.min.js"></script>
    <script>
        if (typeof kendo == 'undefined') { 
            document.write(decodeURIComponent("%3Cscript src='../js/kendo.all.min.js' type='text/javascript'%3E%3C/script%3E"));
        }
    </script>
	<script type="text/javascript">
		//document.write(decodeURIComponent("%3Cscript src='" + RRSiteRelUrl + "/siteassets/js/moment.js' type='text/javascript'%3E%3C/script%3E"));
		//https://github.com/eligrey/FileSaver.js
		document.write(decodeURIComponent("%3Cscript src='../js/FileSaver.min.js' type='text/javascript'%3E%3C/script%3E"));
    </script>
	<script type="text/javascript">
		var RRPageParam = {};
		$.each(window.location.search.substr(1).split('&'), function (n, m) { RRPageParam[(m.split('=')[0])] = (m.split('=')[1] || ''); });
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
			$.ajax(ajaxObj);
			return deferred.promise();
		};

		var RRResources = (function(){
			var createResourceFile = function(localeshort, resourceType) {
				var locale = localeshort.slice(0,2) + '-' + localeshort.slice(2,4);
				if (resourceType !== 'Text') {
					resourceType = 'Provision';
				}
				var obj = {
					url: "../../_api/web/lists/GetByTitle('Translations')/items?$filter=RRTranslationType " + (resourceType === 'Text' ? "eq" : "ne") + " 'Text'&$select=RRResourceId,RRTranslationType,RR" + localeshort + "Text,RR" + localeshort + "Description",
					};
				_get_rest_data(obj)
					.then(function(r) {
						var content = '';
						if (resourceType === 'Text') {
							content = 'var RRResourcesText = {\n';
							$.each(r.d.results, function(n,item) { 
								content += '\t' + item.RRResourceId + ':"' + item[('RR' + localeshort + 'Text')] + ((n<r.d.results.length-1) ? '",\n' : '"\n');
							});
							content += '};\n';
						} else {
							var template = kendo.template($('#resource-'+resourceType).html());
							content = template({locale:localeshort, items:r.d.results});
						}
						$('#content').append(content);
                        if (RRPageParam.preview === undefined) {
                            var blob = new Blob([content], {type: "text/plain;charset=utf-8"});
                            var filename = resourceType === 'Text' ? ('RRResources.' + locale + '.js') : ('Reesink.' + locale + '.resx');
                            saveAs(blob, filename);
                        }
					},function(e) {
						document.write('error');
					});
			};
			if (RRPageParam.locales === undefined) { return; }
			$('#content').html('');
			$.each(RRPageParam.locales.split('|'), function(n, localeshort) {
				createResourceFile(localeshort, RRPageParam.type);
			});
		})();
	</script>

<script id="resource-Text" type="text/kendo-x-template">var RRResourcesText = {
# $.each(items, function(n,item) {#
	#:item.RRResourceId#:"#:item[('RR' + locale + 'Text')]#"#if(n<items.length-1){#,#}});#
};</script>
<script id="resource-Provision" type="text/kendo-x-template"><?xml version="1.0" encoding="utf-8"?>
<root>
  <!-- 
    Microsoft ResX Schema 
    
    Version 2.0
    
    The primary goals of this format is to allow a simple XML format 
    that is mostly human readable. The generation and parsing of the 
    various data types are done through the TypeConverter classes 
    associated with the data types.
    
    Example:
    
    ... ado.net/XML headers & schema ...
    <resheader name="resmimetype">text/microsoft-resx</resheader>
    <resheader name="version">2.0</resheader>
    <resheader name="reader">System.Resources.ResXResourceReader, System.Windows.Forms, ...</resheader>
    <resheader name="writer">System.Resources.ResXResourceWriter, System.Windows.Forms, ...</resheader>
    <data name="Name1"><value>this is my long string</value><comment>this is a comment</comment></data>
    <data name="Color1" type="System.Drawing.Color, System.Drawing">Blue</data>
    <data name="Bitmap1" mimetype="application/x-microsoft.net.object.binary.base64">
        <value>[base64 mime encoded serialized .NET Framework object]</value>
    </data>
    <data name="Icon1" type="System.Drawing.Icon, System.Drawing" mimetype="application/x-microsoft.net.object.bytearray.base64">
        <value>[base64 mime encoded string representing a byte array form of the .NET Framework object]</value>
        <comment>This is a comment</comment>
    </data>
                
    There are any number of "resheader" rows that contain simple 
    name/value pairs.
    
    Each data row contains a name, and value. The row also contains a 
    type or mimetype. Type corresponds to a .NET class that support 
    text/value conversion through the TypeConverter architecture. 
    Classes that don't support this are serialized and stored with the 
    mimetype set.
    
    The mimetype is used for serialized objects, and tells the 
    ResXResourceReader how to depersist the object. This is currently not 
    extensible. For a given mimetype the value must be set accordingly:
    
    Note - application/x-microsoft.net.object.binary.base64 is the format 
    that the ResXResourceWriter will generate, however the reader can 
    read any of the formats listed below.
    
    mimetype: application/x-microsoft.net.object.binary.base64
    value   : The object must be serialized with 
            : System.Runtime.Serialization.Formatters.Binary.BinaryFormatter
            : and then encoded with base64 encoding.
    
    mimetype: application/x-microsoft.net.object.soap.base64
    value   : The object must be serialized with 
            : System.Runtime.Serialization.Formatters.Soap.SoapFormatter
            : and then encoded with base64 encoding.

    mimetype: application/x-microsoft.net.object.bytearray.base64
    value   : The object must be serialized into a byte array 
            : using a System.ComponentModel.TypeConverter
            : and then encoded with base64 encoding.
    -->
  <xsd:schema id="root" xmlns="" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:msdata="urn:schemas-microsoft-com:xml-msdata">
    <xsd:import namespace="http://www.w3.org/XML/1998/namespace" />
    <xsd:element name="root" msdata:IsDataSet="true">
      <xsd:complexType>
        <xsd:choice maxOccurs="unbounded">
          <xsd:element name="metadata">
            <xsd:complexType>
              <xsd:sequence>
                <xsd:element name="value" type="xsd:string" minOccurs="0" />
              </xsd:sequence>
              <xsd:attribute name="name" use="required" type="xsd:string" />
              <xsd:attribute name="type" type="xsd:string" />
              <xsd:attribute name="mimetype" type="xsd:string" />
              <xsd:attribute ref="xml:space" />
            </xsd:complexType>
          </xsd:element>
          <xsd:element name="assembly">
            <xsd:complexType>
              <xsd:attribute name="alias" type="xsd:string" />
              <xsd:attribute name="name" type="xsd:string" />
            </xsd:complexType>
          </xsd:element>
          <xsd:element name="data">
            <xsd:complexType>
              <xsd:sequence>
                <xsd:element name="value" type="xsd:string" minOccurs="0" msdata:Ordinal="1" />
                <xsd:element name="comment" type="xsd:string" minOccurs="0" msdata:Ordinal="2" />
              </xsd:sequence>
              <xsd:attribute name="name" type="xsd:string" use="required" msdata:Ordinal="1" />
              <xsd:attribute name="type" type="xsd:string" msdata:Ordinal="3" />
              <xsd:attribute name="mimetype" type="xsd:string" msdata:Ordinal="4" />
              <xsd:attribute ref="xml:space" />
            </xsd:complexType>
          </xsd:element>
          <xsd:element name="resheader">
            <xsd:complexType>
              <xsd:sequence>
                <xsd:element name="value" type="xsd:string" minOccurs="0" msdata:Ordinal="1" />
              </xsd:sequence>
              <xsd:attribute name="name" type="xsd:string" use="required" />
            </xsd:complexType>
          </xsd:element>
        </xsd:choice>
      </xsd:complexType>
    </xsd:element>
  </xsd:schema>
  <resheader name="resmimetype">
    <value>text/microsoft-resx</value>
  </resheader>
  <resheader name="version">
    <value>2.0</value>
  </resheader>
  <resheader name="reader">
    <value>System.Resources.ResXResourceReader, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</value>
  </resheader>
  <resheader name="writer">
    <value>System.Resources.ResXResourceWriter, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</value>
  </resheader>
#var RRLocaleText = 'RR' + locale + 'Text', RRLocaleDescription = 'RR' + locale + 'Description'; #
# $.each(items, function(n,item) {#
  <data name="RR_#:item.RRTranslationType#_#:item.RRResourceId#_DisplayName" xml:space="preserve"><value>#:item[RRLocaleText]#</value></data>
  <data name="RR_#:item.RRTranslationType#_#:item.RRResourceId#_Description" xml:space="preserve"><value>#=item[RRLocaleDescription] || ""#</value></data>
# }); #
</root>
    </script>
</body>
</html>