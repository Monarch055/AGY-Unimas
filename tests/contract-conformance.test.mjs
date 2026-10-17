import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const monorepoRoot = path.resolve(__dirname, '..');

test('Contract Conformance: OpenAPI v1.1.0 Endpoints Alignment Across Services', () => {
  const openapiPath = path.join(monorepoRoot, 'contracts/api/openapi.yaml');
  assert.ok(fs.existsSync(openapiPath), 'openapi.yaml must exist');
  const openapiContent = fs.readFileSync(openapiPath, 'utf8');

  const expectedEndpoints = [
    '/inventory/scan',
    '/inventory/items',
    '/recommendations/match',
    '/experiments/{slug}/scaffold',
    '/experiments/{slug}/steps/{step_number}/verify-vision',
    '/experiments/{slug}/lab-report/generate',
    '/sync/offline-progress',
  ];

  for (const ep of expectedEndpoints) {
    assert.ok(openapiContent.includes(ep), `OpenAPI must document endpoint ${ep}`);
  }

  // Verify services/ai-agent implements all canonical endpoints
  const aiAgentRouter = fs.readFileSync(
    path.join(monorepoRoot, 'services/ai-agent/app/delivery/http/router.py'),
    'utf8'
  );
  assert.ok(aiAgentRouter.includes('/inventory/scan'));
  assert.ok(aiAgentRouter.includes('/recommendations/match'));
  assert.ok(aiAgentRouter.includes('/experiments/{slug}/scaffold'));
  assert.ok(aiAgentRouter.includes('/experiments/{slug}/steps/{step_number}/verify-vision'));
  assert.ok(aiAgentRouter.includes('/experiments/{slug}/lab-report/generate'));
  assert.ok(aiAgentRouter.includes('/events/stream'));
  assert.ok(aiAgentRouter.includes('/chat/stream'));

  // Verify services/core-api implements handlers
  const coreApiHandlers = fs.readFileSync(
    path.join(monorepoRoot, 'services/core-api/internal/delivery/http/handlers.go'),
    'utf8'
  );
  assert.ok(coreApiHandlers.includes('ScanWorkspaceInventory'));
  assert.ok(coreApiHandlers.includes('MatchThreeTierExperiments'));
  assert.ok(coreApiHandlers.includes('ScaffoldExperimentModule'));
  assert.ok(coreApiHandlers.includes('VerifyStepVision'));
  assert.ok(coreApiHandlers.includes('GenerateAcademicLabReport'));
  assert.ok(coreApiHandlers.includes('SyncOfflineProgress'));
  assert.ok(coreApiHandlers.includes('handleChatSessions'));

  // Verify apps/web api-client invokes the endpoints
  const webApiClient = fs.readFileSync(
    path.join(monorepoRoot, 'apps/web/src/lib/api-client.ts'),
    'utf8'
  );
  assert.ok(webApiClient.includes('/inventory/scan'));
  assert.ok(webApiClient.includes('/recommendations/match'));
  assert.ok(webApiClient.includes('/scaffold'));
  assert.ok(webApiClient.includes('/verify-vision'));
  assert.ok(webApiClient.includes('/lab-report/generate'));
});

test('Contract Conformance: 4-Level Age-Adaptive Levels Integrity', () => {
  const levels = [
    'SD_ELEMENTARY',
    'SMP_LOWER_SEC',
    'SMA_UPPER_SEC',
    'HIGHER_ED_UNI',
  ];

  const typesTs = fs.readFileSync(
    path.join(monorepoRoot, 'packages/shared-types/src/index.ts'),
    'utf8'
  );
  const aiModels = fs.readFileSync(
    path.join(monorepoRoot, 'services/ai-agent/app/domain/models.py'),
    'utf8'
  );
  const coreDomain = fs.readFileSync(
    path.join(monorepoRoot, 'services/core-api/internal/domain/entities.go'),
    'utf8'
  );

  for (const lvl of levels) {
    assert.ok(typesTs.includes(lvl), `packages/shared-types must define ${lvl}`);
    assert.ok(aiModels.includes(lvl), `services/ai-agent must define ${lvl}`);
    assert.ok(coreDomain.includes(lvl), `services/core-api must define ${lvl}`);
  }
});

test('Contract Conformance: Zero-RabbitMQ Directive Verification', () => {
  const dockerCompose = fs.readFileSync(
    path.join(monorepoRoot, 'docker-compose.yml'),
    'utf8'
  );
  assert.ok(
    !dockerCompose.includes('rabbitmq'),
    'docker-compose.yml must have ZERO rabbitmq service definitions'
  );
  assert.ok(
    !dockerCompose.includes('5672'),
    'docker-compose.yml must not expose AMQP port 5672'
  );

  const adkEngine = fs.readFileSync(
    path.join(monorepoRoot, 'services/ai-agent/app/agents/adk_orchestrator.py'),
    'utf8'
  );
  assert.ok(
    adkEngine.includes('ZERO_RABBITMQ_DIRECT_REST_AND_SSE'),
    'Google ADK manifest must declare ZERO_RABBITMQ_DIRECT_REST_AND_SSE broker mode'
  );
});

test('Contract Conformance: Co-Location Safety Rule Code Alignment', () => {
  const criticalRule = 'HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER';

  const sqlSeed = fs.readFileSync(
    path.join(monorepoRoot, 'services/core-api/migrations/003_seed_id_my_catalog_substitutes_and_experiments.sql'),
    'utf8'
  );
  assert.ok(sqlSeed.includes(criticalRule), 'SQL seed must define HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER');

  const pyKnowledge = fs.readFileSync(
    path.join(monorepoRoot, 'services/ai-agent/app/domain/catalog_knowledge.py'),
    'utf8'
  );
  assert.ok(pyKnowledge.includes(criticalRule), 'Python catalog knowledge must define HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER');
});
