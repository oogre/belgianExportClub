<?php

	ini_set('display_errors', '1');

	header("Access-Control-Allow-Origin: *"); // Required for cross-domain and/or different-port XHR

	include('./conf/index.php');
	include('./db/index.php');


	if(empty($_SERVER['REDIRECT_URL']) || 3 > count($REDIRECT_URL = explode('/', $_SERVER['REDIRECT_URL']))){
		echo "ASK FOR SOMETHING DUDE !!!";
		exit();
	}
	
	$action = $REDIRECT_URL[1];
	$model = $REDIRECT_URL[2];
	$request = $_REQUEST;

	$SQL = '';
	switch ($model.$action) {
		case 'getcompanies': 
			$SQL = 	' SELECT * '.
					' FROM companies ';
			if(!empty($request['tag']))
			{
				$SQL .= ' LEFT JOIN tag_company ON tag_company.company_id = companies.id ';
				$SQL .= ' LEFT JOIN tags ON tag_company.tag_id = tags.id ';
				$SQL .= ' WHERE LOWER(tags.name) IN ('.strtolower('"'.implode('","', explode(',', $request['tag'])).'"').')';
			}
			if(!empty($request['id']))
			{
				$SQL .= ' WHERE companies.id IN ('.$request['id'].')';
			}
		break;
		case 'getusers': 
			$SQL = 	' SELECT * '.
					' FROM users ';
			if(!empty($request['phonenumber']))
			{
				$SQL .= ' WHERE LOWER(users.phonenumber) IN ('.strtolower('"'.implode('","', explode(',', $request['phonenumber'])).'"').')';
			}
		break;
	}

	echo json_encode(array(
		'status'	=> 'ok', 
		'data'		=> requestDB($conf['ACCESS']['DB'] ,$SQL)));
/**/
?>