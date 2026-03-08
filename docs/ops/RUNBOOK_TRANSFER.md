# OPS3 INTER-LOCATION TRANSFER RUNBOOK

## 1. Transfer Initiation
- [ ] SELECT source location and unit (e.g. `FAC-01`).
- [ ] SELECT destination location and unit (e.g. `CS-01`).
- [ ] Weigh product units.
- [ ] ACTION: Record Transfer Document (`transfer_interlocation`).
- [ ] Logic: `transfer_initiated` at source.
- [ ] Verify: Source stock decreases.

## 2. In-Transit Monitoring
- [ ] Monitor: Check `transfer_views` status `in_transit`.
- [ ] Alert: If aging > `control_config.transfer_delay_hours`, investigate.

## 3. Transfer Receipt
- [ ] Re-weigh product unidades at destination.
- [ ] ACTION: Record Receive Document (`transfer_received`).
- [ ] Logic: `transfer_received` at destination.
- [ ] Verify: Destination stock increases.
