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
	switch ($action.$model) {
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
				$SQL .= ' WHERE LOWER(users.phonenumber) LIKE '.strtolower('"%'.$request['phonenumber'].'%"');
			}
		break;

		case 'setusertagdisinterest':
			$SQL = 	' INSERT INTO user_tag_disinterest '.
					' ( ' . implode(',', array_keys($request)) . ' ) '.
					' VALUES ('.strtolower('"'.implode('","', array_values($request)).'"').')';
			requestDB($conf['ACCESS']['DB'] ,$SQL, false);
		case 'getusertagdisinterest':
			$SQL = 	' SELECT * '.
					' FROM user_tag_disinterest '.
					' WHERE user_id = ' . $request['user_id'];
		break;
		case 'gettag': 
		case 'gettags': 
					if(!empty($request['user_id'])){
						$SQL = 	' SELECT DISTINCT(tags.id) AS tag_id, tags.name tag_name  '.
								' FROM tags '.
								' LEFT JOIN tag_company ON tag_company.tag_id = tags.id '.
								' LEFT JOIN user_tag_disinterest ON user_tag_disinterest.tag_id = tags.id AND user_tag_disinterest.user_id = '.$request['user_id'].
								' WHERE tags.id IS NOT NULL '.
								' AND user_tag_disinterest.tag_id IS NULL '.
								' AND tag_company.company_id IS NOT NULL';
					}else{
						$SQL = 	' SELECT DISTINCT(tags.id) AS tag_id, tags.name tag_name  '.
								' FROM tags '.
								' LEFT JOIN tag_company ON tag_company.tag_id = tags.id '.
								' WHERE tags.id IS NOT NULL '.
								' AND tag_company.company_id IS NOT NULL ';
					}
		break;
		case 'setusers': 
			$SQL = 	' INSERT INTO users '.
					' ( ' . implode(',', array_keys($request)) . ' ) '.
					' VALUES ('.strtolower('"'.implode('","', array_values($request)).'"').')';
			requestDB($conf['ACCESS']['DB'] ,$SQL, false);
			$SQL = 	' SELECT * '.
					' FROM users '.
					' WHERE id = (SELECT MAX(id)  FROM users)';
		break;
		default:
			echo json_encode(array(
				'status'	=> 'ko', 
				'data'		=> false));		
			exit();
		break;
	}

	echo json_encode(array(
		'status'	=> 'ok', 
		'data'		=> requestDB($conf['ACCESS']['DB'] ,$SQL)));
/**/
?>