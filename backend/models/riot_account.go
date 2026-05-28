package models

type RiotLinkRequest struct {
	GameName string `json:"gameName"`
	TagLine  string `json:"tagLine"`
	Region   string `json:"region"`
}

type RiotAccount struct {
	ID             int    `json:"id"`
	UserID         int    `json:"userId"`
	GameName       string `json:"gameName"`
	TagLine        string `json:"tagLine"`
	Region         string `json:"region"`
	PUUID          string `json:"puuid"`
	SummonerID     string `json:"summonerId"`
	ProfileIconID int    `json:"profileIconId"`
	SummonerLevel  int64  `json:"summonerLevel"`
}

type RiotAccountAPIResponse struct {
	PUUID    string `json:"puuid"`
	GameName string `json:"gameName"`
	TagLine  string `json:"tagLine"`
}

type RiotSummonerAPIResponse struct {
	ID             string `json:"id"`
	AccountID      string `json:"accountId"`
	PUUID          string `json:"puuid"`
	ProfileIconID int    `json:"profileIconId"`
	SummonerLevel  int64  `json:"summonerLevel"`
}