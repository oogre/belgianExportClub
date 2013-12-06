<?php 
function requestDB ($DB, $SQL, $return = true){
	if(!isset($SQL) || !isset($DB)){
		throw new Exception("SQL OR DB NEEDED", 1);
	}
	
	$con=mysql_connect($DB['host'],$DB['user'],$DB['password']);
	// Check connection
	if (!$con)
	{
		return false;
	}
	else{
		mysql_select_db($DB['db'], $con);
		$query = $SQL;
		$result = mysql_query($query);
		if($return)
		{
			$array = array();
			while($array[] = mysql_fetch_assoc($result));
			mysql_close($con);
			array_pop($array);
			return $array;	
		}
		else{
			mysql_close($con);
		}
	}/**/
}
?>