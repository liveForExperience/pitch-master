UPDATE `match`
SET `status` = 'MATCH_FINISHED'
WHERE `status` = 'SETTLED';
