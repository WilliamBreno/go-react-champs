package models

type Champion struct {
	ID             int    `json:"id"`
	Nome           string `json:"nome"`
	Maestria       int    `json:"maestria,omitempty"`

	Lane           string `json:"lane"`
	Prioridade     string `json:"prioridade"`
	Status         string `json:"status"`
	Notes          string `json:"notes"`
	RiotDifficulty int    `json:"riotDifficulty"`

	MetaStatus       string  `json:"metaStatus"`
	MetaRankPosition int     `json:"metaRankPosition"`
	MetaWinRate      float64 `json:"metaWinRate"`
	MetaPickRate     float64 `json:"metaPickRate"`
	MetaBuildJSON    string  `json:"metaBuildJson"`
	MetaUpdatedAt    string  `json:"metaUpdatedAt,omitempty"`

	IDUser    int    `json:"idUser,omitempty"`
	CreatedAt string `json:"createdAt,omitempty"`
	UpdatedAt string `json:"updatedAt,omitempty"`
}

type ChampionResponse struct {
	Dados        []Champion `json:"dados"`
	Pagina       int        `json:"pagina"`
	Limite       int        `json:"limite"`
	Total        int        `json:"total"`
	TotalPaginas int        `json:"totalPaginas"`
}