<?php 
	// discern what's being asked of us
	$page = $_GET['page'];
	// make sure somethign was requested of us
	if (!empty($page)){
		// make sure we are looking for a legitamate page
		$pages = ["categories", "countries", "locations", "interests", "reasons", "currentLocation"];
		if (array_search($page, $pages) !== false){
			echo(file_get_contents("http://www.herdict.org/action/ajax/plugin/init-" . $page . "/"));
		}
	}
?>