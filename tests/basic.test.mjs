import { test } from 'node:test';
import assert from 'node:assert';
import { handleCommand } from '../src/commands/index.mjs';

test('handleCommand executes without error', async (t) => {
    await assert.doesNotReject(handleCommand);
}); 