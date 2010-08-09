var infoGeoloc;
var ipv4;
var ipv6;
var pageHtml;
var hc;
var hd;

function url_complete_cb_geoloc(final_cb, type, event)
{
   if(!ipv4) {
      ipv4 = getIpV4(pageHtml);
      pageHtml = "";
      if(ipv4 != "")
	 connect_server_geoloc(ipv4, final_cb);
   } else {
   infoGeoloc = eval("(" + pageHtml +")");
   fin(final_cb);
   }
   
   return 0;
}

function getIpV4(pageHtml)
{
   debutIPV4 = pageHtml.indexOf("<div id=\"ipv4\"><div id=\"ip\">IP V4 : &nbsp;&nbsp;", 0);
   if(debutIPV4 > 0) debutIPV4 += 48;
   finIPV4 = pageHtml.indexOf("</div>", debutIPV4);
   
   debutIPV6 = pageHtml.indexOf("<div id=\"ipv6\"><div id=\"ip\">IP V6 : &nbsp;&nbsp;", 0);
   if(debutIPV6 > 0) debutIPV6 += 48;
   finIPV6 = pageHtml.indexOf("</div>", debutIPV6);
   
   ipv4 = "";
   
   if(debutIPV4 >= 0)
      ipv4 = pageHtml.substring(debutIPV4, finIPV4);
      
   if(debutIPV6 >= 0) {
      ipv4hexa = "";
      ipv6 = pageHtml.substring(debutIPV6, finIPV6);
      chunks = ipv6.split(":");
      
      if(chunks[0] == "2a01" && chunks[1].substr(0,2) == "e3"){
	ipv4hexa += chunks[1].charAt(2);
	while(chunks[2].length < 4)
	 chunks[2] = "0"+chunks[2];
	
	ipv4hexa += chunks[2];
	
	while(chunks[3].length < 4)
	 chunks[3] = "0"+chunks[3];
	
	ipv4hexa += chunks[3].substr(0,3);
      
      for(i=0 ; i<4; i++)
	 ipv4 += parseInt(ipv4hexa.substr(i*2,2),16) + ".";
      
      ipv4 = ipv4.substr(0, ipv4.length-1);
      }
   }
   return ipv4;
}

function connect_server_geoloc(ipv4, final_cb)
{
   var hd, hc;
   
   hc = ecore_event_handler_add(ECORE_CON_EVENT_URL_COMPLETE, url_complete_cb_geoloc, final_cb);
   hd = ecore_event_handler_add(ECORE_CON_EVENT_URL_DATA, url_data_cb_geoloc, null);
   
   if(ipv6)
   azer = ecore_con_url_new("http://ipinfodb.com.sixxs.org/ip_query.php?ip="+ipv4+"&output=json&timezone=false");
   else
   azer = ecore_con_url_new("http://ipinfodb.com./ip_query.php?ip="+ipv4+"&output=json&timezone=false");
     
   ecore_con_url_data_set(azer, "azer");
   ecore_con_url_send(azer, null, null);
   }

function url_data_cb_geoloc(data, type, event)
{
   pageHtml += event.data;
   return 0;
}

function connect_server_ip(final_cb)
{
   hc = ecore_event_handler_add(ECORE_CON_EVENT_URL_COMPLETE, url_complete_cb_geoloc, final_cb);
   hd = ecore_event_handler_add(ECORE_CON_EVENT_URL_DATA, url_data_cb_geoloc, null);
   
   azer = ecore_con_url_new("http://adresseipv6.com/");
   ecore_con_url_data_set(azer, "azer");
   ecore_con_url_send(azer, null, null);
}

function get_geoloc_info(final_cb){
   if(infoGeoloc) return infoGeoloc;
   
   if(ipv4)
      connect_server_geoloc(ipv4, final_cb);
   else
      connect_server_ip(final_cb);
   return;
}

function fin(final_cb) {
   ecore_event_handler_del(hc);
   ecore_event_handler_del(hd);
   final_cb(infoGeoloc);
}