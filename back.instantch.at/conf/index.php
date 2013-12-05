<?php
	define('CONFIGURATION_PATH', realpath(dirname(__FILE__)));
	define('ROOT', realpath(CONFIGURATION_PATH . '/../'));
	$conf = json_decode(file_get_contents(CONFIGURATION_PATH . '/conf.json'), true);
?>