# CybeWatch AI — Dataset Documentation

## 1. Dataset Origin & Licensing
The benchmark dataset used in CybeWatch AI is modeled after the statistical distributions of the published **UNSW-NB15** and **CIC-IDS2017** benchmark intrusion detection datasets.
- **Licensing**: Academic & Open-Source Research License
- **Total Records Generated**: 20,000 network flows
- **Stratified Partitioning**:
  * Training Split: 14,000 flows (70%) -> `datasets/train_flows.csv`
  * Validation Split: 3,000 flows (15%) -> `datasets/val_flows.csv`
  * Held-Out Test Split: 3,000 flows (15%) -> `datasets/test_flows.csv`
  * Demo Sample Batch: 210 flows -> `datasets/sample/sample_events.csv` & `sample_events.json`

## 2. Feature Schema & Definitions

| Feature Name | Type | Unit / Range | Description |
| :--- | :--- | :--- | :--- |
| `source_ip` | string | IPv4 address | Source host initiating packet flow |
| `destination_ip` | string | IPv4 address | Destination target host |
| `source_port` | int | 1 - 65535 | Originating ephemeral port |
| `destination_port` | int | 1 - 65535 | Targeted service port (22, 80, 443, etc.) |
| `protocol` | string | tcp, udp, icmp | Transport protocol |
| `service` | string | http, ssl, ssh, dns, ftp, - | Application layer daemon |
| `duration` | float | Seconds | Flow connection lifetime |
| `src_bytes` | int | Bytes | Bytes sent from source to destination |
| `dst_bytes` | int | Bytes | Bytes sent from destination to source |
| `src_pkts` | int | Count | Packets sent from source to destination |
| `dst_pkts` | int | Count | Packets sent from destination to source |
| `sload` | float | Bits per second | Source transmission rate |
| `dload` | float | Bits per second | Destination transmission rate |
| `sttl` | int | 0 - 255 | Source IP Time-To-Live |
| `dttl` | int | 0 - 255 | Destination IP Time-To-Live |
| `loss_rate` | float | 0.0 - 1.0 | Packet retransmission / loss fraction |
| `label` | string | 6 classes | Target classification label |
