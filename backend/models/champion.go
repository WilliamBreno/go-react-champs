package models

type Champion struct {
	ID       int     `json:"id"`
	Nome     string  `json:"nome"`
	Maestria float64 `json:"maestria"`
}

type ChampionResponse struct {
	Dados        []Champion `json:"dados"`
	Pagina      int        `json:"pagina"`
	Limite      int        `json:"limite"`
	Total       int        `json:"total"`
	TotalPaginas int       `json:"totalPaginas"`
}