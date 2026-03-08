# OPS3 FACTORY PROCESS RUNBOOK

## 1. Batch Start
- [ ] SELECT input from Hub Storage (`raw-tuna`).
- [ ] Weigh Input `input_qty`.
- [ ] ACTION: Start Processing Batch.

## 2. Transformation (WIP)
- [ ] Butchery, Loining, Grading.
- [ ] ACTION: Transformation Document (`transformation`).
- [ ] Logic: `transformation_out` (input) -> `transformation_in` (output).
- [ ] Record `waste_qty` for yield audit.

## 3. Batch Finish
- [ ] Weigh Total Output `output_qty`.
- [ ] Final ACTION: Set `processing_batches.status` to `completed`.
- [ ] Verify: `factory_performance_views` for yield variance within threshold.
- [ ] Logic: Batch ID inheritance preserved.
