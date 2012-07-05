<?php 
	// discern what's being asked of us
	$page = $_GET['page'];
	$data = $_GET['data'];
	// make sure somethign was requested of us
	if (!empty($page)){
		// make sure we are looking for a legitamate page
		$pages = array("categories", "countries", "locations", "interests", "reasons", "currentLocation");
		if (array_search($page, $pages) !== false){
			// plugin selection menu options
			echo(file_get_contents("http://www.herdict.org/action/ajax/plugin/init-" . $page . "/"));
		}
		else if ($page == "topsites"){
			// explore top sites
			echo(file_get_contents("http://www.herdict.org/explore/module/topsites?fc=" . $data));
		}
		else if ($page == "site"){
			// explore specific site data
			echo(file_get_contents("http://www.herdict.org/action/ajax/plugin/site/" . $data));
		}
		else if ($page == "list"){
			// explore specific site data
			echo(file_get_contents("http://herdict.podconsulting.net/ajax/lists/" . $data . "/pages"));
		}
		else if ($page == "report"){
			// explore specific site data
			// TODO: Report to actual API
			echo(file_get_contents("http://dev2.herdict.org/action/ajax/plugin/report?" . $_SERVER['QUERY_STRING']));
		}
	}
?>