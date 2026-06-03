package models

type ChampionMetaResponse struct {
	Champion         string  `json:"champion"`
	Lane             string  `json:"lane"`
	MetaStatus       string  `json:"metaStatus"`
	MetaRankPosition int     `json:"metaRankPosition"`
	MetaWinRate      float64 `json:"metaWinRate"`
	MetaPickRate     float64 `json:"metaPickRate"`
	MetaBuildJSON    string  `json:"metaBuildJson"`
}

type SaveChampionMetaRequest struct {
	MetaStatus       string  `json:"metaStatus"`
	MetaRankPosition int     `json:"metaRankPosition"`
	MetaWinRate      float64 `json:"metaWinRate"`
	MetaPickRate     float64 `json:"metaPickRate"`
	MetaBuildJSON    string  `json:"metaBuildJson"`
}