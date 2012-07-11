<?php 
	// discern what's being asked of us
	$page = $_GET['page'];
	$data = $_GET['data'];
	// make sure somethign was requested of us
	if (!empty($page)){
		// make sure we are looking for a legitamate page
		$pages = array("categories", "countries", "locations", "interests", "reasons");
		if (array_search($page, $pages) !== false){
			// plugin selection menu options
			echo(file_get_contents("http://www.herdict.org/action/ajax/plugin/init-" . $page . "/"));
		}
		else if ($page == "currentLocation"){
			echo(file_get_contents("http://www.herdict.org/action/ajax/plugin/init-currentLocation/?ip=" . $_SERVER['REMOTE_ADDR']));
		}
		else if ($page == "topsites"){
			// explore top sites
			echo(file_get_contents("http://www.herdict.org/explore/module/topsites?fc=" . $data));
		}
		else if ($page == "site"){
			// explore specific site data
			echo(file_get_contents("http://www.herdict.org/action/ajax/plugin/site/" . $data));
		}
		else if ($page == "report"){
			// TODO: Report to actual API
			echo(file_get_contents("http://dev2.herdict.org/action/ajax/plugin/report?" . $_SERVER['QUERY_STRING']));
		}
		else if ($page == "stop"){
			header("HTTP/1.0 204 No Content");
		}
		else if ($page == "lists"){
			echo(file_get_contents("http://dev2.herdict.org/ajax/lists/" . $data));
		}
	}
?>