// Package astparser provides helper wrappers around gotreesitter for the ast-service.
// Uses pure-Go Tree-sitter runtime — no CGO required, enabling cross-compilation.
package astparser

// ASTFeatures holds the structural metrics extracted from a code submission.
// These values feed directly into the cognitive_effort_index computation
// and the Content-Based Recommendation System (CBRS).
type ASTFeatures struct {
	Language         string   `json:"language"`
	MaxLoopDepth     int      `json:"max_loop_depth"`      // Nesting depth of loops
	RecursionUsed    bool     `json:"recursion_used"`       // Any recursive function calls?
	FunctionCount    int      `json:"function_count"`       // Number of defined functions
	VariableCount    int      `json:"variable_count"`       // Total variable declarations
	ComplexityScore  float64  `json:"complexity_score"`     // Composite structural complexity
	ErrorPatterns    []string `json:"error_patterns"`       // Detected structural anomalies
	RawASTJSON       string   `json:"raw_ast_json"`         // Full AST for PostgreSQL JSONB storage
}

// ParseCode parses source code and returns ASTFeatures.
// NOTE: Full gotreesitter integration will be implemented in Phase 4.
// This stub returns a placeholder to allow other services to compile.
func ParseCode(sourceCode, language string) (*ASTFeatures, error) {
	// TODO (Phase 4): Integrate github.com/smacker/go-tree-sitter (gotreesitter)
	// Steps:
	//   1. Select language grammar based on `language` param
	//   2. Parse sourceCode into CST
	//   3. Walk tree to compute max_loop_depth, recursion_used, etc.
	//   4. Serialize full AST to JSON for PostgreSQL JSONB storage
	return &ASTFeatures{
		Language:        language,
		MaxLoopDepth:    0,
		RecursionUsed:   false,
		FunctionCount:   0,
		VariableCount:   0,
		ComplexityScore: 0.0,
		ErrorPatterns:   []string{},
		RawASTJSON:      "{}",
	}, nil
}
