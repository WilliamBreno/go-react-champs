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

type RiotRankedEntry struct {
	LeagueID     string `json:"leagueId"`
	QueueType    string `json:"queueType"`
	Tier         string `json:"tier"`
	Rank         string `json:"rank"`
	SummonerID   string `json:"summonerId"`
	LeaguePoints int    `json:"leaguePoints"`
	Wins         int    `json:"wins"`
	Losses       int    `json:"losses"`
	HotStreak    bool   `json:"hotStreak"`
	Veteran      bool   `json:"veteran"`
	FreshBlood   bool   `json:"freshBlood"`
	Inactive     bool   `json:"inactive"`
}

type RiotLiveGameStatus struct {
	IsInGame         bool   `json:"isInGame"`
	GameID           int64  `json:"gameId,omitempty"`
	GameMode         string `json:"gameMode,omitempty"`
	GameType         string `json:"gameType,omitempty"`
	GameQueueConfigID int   `json:"gameQueueConfigId,omitempty"`
	GameStartTime    int64  `json:"gameStartTime,omitempty"`
	GameLength       int64  `json:"gameLength,omitempty"`
}

type RiotProfileResponse struct {
	RiotAccount
	Ranked     []RiotRankedEntry  `json:"ranked"`
	LiveStatus RiotLiveGameStatus `json:"liveStatus"`
}