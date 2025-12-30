// Activity registry
// Import node activities
import { httpRequestActivity } from './nodes/http-request';
import { generateFlowFileActivity } from './nodes/generate-flowfile';
import { updateAttributeActivity } from './nodes/update-attribute';
import { mergeContentActivity } from './nodes/merge-content';
import { extractTextActivity } from './nodes/extract-text';
import { convertRecordActivity } from './nodes/convert-record';
import { splitJsonActivity } from './nodes/split-json';
import { replaceTextActivity } from './nodes/replace-text';
import { putEmailActivity } from './nodes/put-email';
import { executeSqlActivity } from './nodes/execute-sql';
import { putSqlActivity } from './nodes/put-sql';
import { queryRecordActivity } from './nodes/query-record';
import { jslTransformJsonActivity } from './nodes/jsl-transform-json';
import { joltTransformJsonActivity } from './nodes/jolt-transform-json';
import { routeOnAttributeActivity } from './nodes/route-on-attribute';
import { mergeRecordActivity } from './nodes/merge-record';
import { splitRecordActivity } from './nodes/split-record';
import { modifyBytesActivity } from './nodes/modify-bytes';
import { logAttributeActivity } from './nodes/log-attribute';
import { evaluateJsonPathActivity } from './nodes/evaluate-jsonpath';

// Map n8n node types to Temporal activities
export const activities = {
	// HTTP Request node
	'n8n-nodes-base.httpRequest': httpRequestActivity,
	// GenerateFlowFile node (NiFi-like)
	'n8n-nodes-base.generateFlowFile': generateFlowFileActivity,
	// UpdateAttribute node (NiFi-like)
	'n8n-nodes-base.updateAttribute': updateAttributeActivity,
	// MergeContent node (NiFi-like)
	'n8n-nodes-base.mergeContent': mergeContentActivity,
	// ExtractText node (NiFi-like)
	'n8n-nodes-base.extractText': extractTextActivity,
	// ConvertRecord node (NiFi-like)
	'n8n-nodes-base.convertRecord': convertRecordActivity,
	// SplitJSON node (NiFi-like)
	'n8n-nodes-base.splitJson': splitJsonActivity,
	// ReplaceText node (NiFi-like)
	'n8n-nodes-base.replaceText': replaceTextActivity,
	// PutEmail node (NiFi-like)
	'n8n-nodes-base.putEmail': putEmailActivity,
	// ExecuteSQL node (NiFi-like)
	'n8n-nodes-base.executeSql': executeSqlActivity,
	// PutSQL node (NiFi-like)
	'n8n-nodes-base.putSql': putSqlActivity,
	// QueryRecord node (NiFi-like)
	'n8n-nodes-base.queryRecord': queryRecordActivity,
	// JSLTransformJSON node (NiFi-like)
	'n8n-nodes-base.jslTransformJson': jslTransformJsonActivity,
	// JoltTransformJSON node (NiFi-like)
	'n8n-nodes-base.joltTransformJson': joltTransformJsonActivity,
	// RouteOnAttribute node (NiFi-like)
	'n8n-nodes-base.routeOnAttribute': routeOnAttributeActivity,
	// MergeRecord node (NiFi-like)
	'n8n-nodes-base.mergeRecord': mergeRecordActivity,
	// SplitRecord node (NiFi-like)
	'n8n-nodes-base.splitRecord': splitRecordActivity,
	// ModifyBytes node (NiFi-like)
	'n8n-nodes-base.modifyBytes': modifyBytesActivity,
	// LogAttribute node (NiFi-like)
	'n8n-nodes-base.logAttribute': logAttributeActivity,
	// EvaluateJsonPath node (NiFi-like)
	'n8n-nodes-base.evaluateJsonPath': evaluateJsonPathActivity,
	// Add more node activities here as they are implemented
	// Example:
	// 'n8n-nodes-base.code': codeActivity,
	// 'n8n-nodes-base.set': setActivity,
};
