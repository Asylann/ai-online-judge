package service

import (
	"bytes"
	"encoding/json"
	"math"
)

// CalculateASTSimilarity compares two AST JSON snapshots by analyzing the frequency
// and depth of specific node types (e.g., for_statement, if_statement, binary_expression).
// Returns a structural similarity score between 0.0 and 1.0 (0% to 100%).
func CalculateASTSimilarity(ast1, ast2 []byte) float64 {
	if len(ast1) == 0 || len(ast2) == 0 {
		if len(ast1) == len(ast2) {
			return 1.0
		}
		return 0.0
	}

	if bytes.Equal(ast1, ast2) {
		return 1.0
	}

	var root1, root2 interface{}
	err1 := json.Unmarshal(ast1, &root1)
	err2 := json.Unmarshal(ast2, &root2)
	if err1 != nil || err2 != nil {
		// Fallback for non-JSON or raw text comparison
		if bytes.Equal(bytes.TrimSpace(ast1), bytes.TrimSpace(ast2)) {
			return 1.0
		}
		return 0.0
	}

	freq1 := make(map[string]float64)
	depth1 := make(map[string]float64)
	walkASTNode(root1, 1, freq1, depth1)

	freq2 := make(map[string]float64)
	depth2 := make(map[string]float64)
	walkASTNode(root2, 1, freq2, depth2)

	if len(freq1) == 0 && len(freq2) == 0 {
		if bytes.Equal(ast1, ast2) {
			return 1.0
		}
		return 0.0
	}
	if len(freq1) == 0 || len(freq2) == 0 {
		return 0.0
	}

	// 1. Calculate Cosine Similarity across node frequencies
	allKeys := make(map[string]struct{})
	for k := range freq1 {
		allKeys[k] = struct{}{}
	}
	for k := range freq2 {
		allKeys[k] = struct{}{}
	}

	var dot, magSq1, magSq2 float64
	for k := range allKeys {
		v1 := freq1[k]
		v2 := freq2[k]
		dot += v1 * v2
		magSq1 += v1 * v1
		magSq2 += v2 * v2
	}

	if magSq1 == 0 || magSq2 == 0 {
		return 0.0
	}
	cosSim := dot / (math.Sqrt(magSq1) * math.Sqrt(magSq2))

	// 2. Calculate Depth Profile Similarity across shared node types
	var depthDiffSum float64
	var sharedCount int
	for k := range allKeys {
		v1 := freq1[k]
		v2 := freq2[k]
		if v1 > 0 && v2 > 0 {
			avgD1 := depth1[k] / v1
			avgD2 := depth2[k] / v2
			maxD := math.Max(1.0, math.Max(avgD1, avgD2))
			depthDiffSum += math.Abs(avgD1-avgD2) / maxD
			sharedCount++
		}
	}

	depthSim := cosSim
	if sharedCount > 0 {
		depthSim = math.Max(0.0, 1.0-(depthDiffSum/float64(sharedCount)))
	}

	// 3. Composite score (70% frequency distribution + 30% structural depth profile)
	sim := 0.70*cosSim + 0.30*depthSim
	return math.Max(0.0, math.Min(1.0, sim))
}

func walkASTNode(node interface{}, depth int, freq map[string]float64, depthProfile map[string]float64) {
	if node == nil {
		return
	}

	switch v := node.(type) {
	case map[string]interface{}:
		// Check explicit node type field
		var nodeType string
		if t, ok := v["type"].(string); ok && t != "" {
			nodeType = t
		} else if t, ok := v["node_type"].(string); ok && t != "" {
			nodeType = t
		} else if t, ok := v["kind"].(string); ok && t != "" {
			nodeType = t
		}

		if nodeType != "" {
			freq[nodeType]++
			depthProfile[nodeType] += float64(depth)
		}

		// Also check numerical metrics representing structural features
		for k, val := range v {
			if k == "stub" || k == "language" || k == "note" || k == "type" || k == "node_type" || k == "kind" {
				continue
			}
			if num, ok := val.(float64); ok && num > 0 {
				freq[k] += num
				depthProfile[k] += float64(depth) * num
			}
			walkASTNode(val, depth+1, freq, depthProfile)
		}
	case []interface{}:
		for _, elem := range v {
			walkASTNode(elem, depth+1, freq, depthProfile)
		}
	}
}
