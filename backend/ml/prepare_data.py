"""
CybeWatch AI - Data Preparation and Synthesis Script
Generates a realistic, statistically grounded network intrusion detection dataset
inspired by UNSW-NB15 and CIC-IDS2017 flow distributions.
"""

import os
import json
import numpy as np
import pandas as pd
from typing import Tuple

# Define paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DATASETS_DIR = os.path.join(BASE_DIR, "datasets")
SAMPLE_DIR = os.path.join(DATASETS_DIR, "sample")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")

CATEGORIES = ["Benign", "DoS", "PortScan", "BruteForce", "Botnet", "Exploits"]


def generate_synthetic_flow_dataset(
    n_samples: int = 15000,
    random_state: int = 42
) -> pd.DataFrame:
    """
    Synthesize realistic network flow records modeled after UNSW-NB15 / CIC-IDS2017 distributions.
    Strict class separation with realistic overlapping boundary noise to evaluate genuine classifier performance.
    """
    np.random.seed(random_state)
    
    # Class distribution (realistic SOC imbalance: majority benign, various attack types)
    class_probs = [0.60, 0.12, 0.10, 0.08, 0.05, 0.05]
    labels = np.random.choice(CATEGORIES, size=n_samples, p=class_probs)
    
    records = []
    
    internal_subnet = "192.168.1."
    dmz_subnet = "10.0.0."
    external_ips = [
        "198.51.100.23", "203.0.113.88", "185.220.101.5", "45.33.32.156",
        "91.240.118.172", "194.26.29.112", "103.251.167.20", "176.119.25.4"
    ]
    
    for i, label in enumerate(labels):
        if label == "Benign":
            proto = np.random.choice(["tcp", "udp"], p=[0.75, 0.25])
            if proto == "udp":
                service = "dns"
                dst_port = 53
                duration = np.random.exponential(scale=0.04)
                src_pkts = np.random.randint(1, 4)
                dst_pkts = np.random.randint(1, 4)
                src_bytes = src_pkts * np.random.randint(40, 80)
                dst_bytes = dst_pkts * np.random.randint(60, 200)
            else:
                service = np.random.choice(["http", "ssl", "ssh"], p=[0.4, 0.55, 0.05])
                dst_port = 443 if service == "ssl" else (80 if service == "http" else 22)
                duration = np.random.exponential(scale=1.5) + 0.05
                src_pkts = np.random.randint(5, 40)
                dst_pkts = np.random.randint(5, 60)
                src_bytes = src_pkts * np.random.randint(60, 250)
                dst_bytes = dst_pkts * np.random.randint(200, 1400)
                
            src_ip = f"{internal_subnet}{np.random.randint(10, 150)}"
            dst_ip = f"{dmz_subnet}{np.random.randint(2, 20)}"
            sttl = np.random.choice([64, 128], p=[0.8, 0.2])
            dttl = np.random.choice([64, 56], p=[0.7, 0.3])
            loss_rate = np.random.uniform(0.0, 0.01)
            
        elif label == "DoS":
            # High volume, rapid packets, tiny duration, small payloads (SYN / UDP Flood)
            proto = np.random.choice(["tcp", "udp"], p=[0.8, 0.2])
            service = "http" if proto == "tcp" else "dns"
            dst_port = np.random.choice([80, 443, 8080, 53])
            duration = np.random.uniform(0.001, 0.25)
            src_pkts = np.random.randint(150, 1500)
            dst_pkts = np.random.randint(0, 10)  # Target overwhelmed, few or zero responses
            src_bytes = src_pkts * np.random.randint(40, 64)
            dst_bytes = dst_pkts * np.random.randint(0, 40)
            src_ip = np.random.choice(external_ips)
            dst_ip = f"{dmz_subnet}{np.random.randint(2, 5)}"
            sttl = np.random.choice([48, 54, 112])
            dttl = 0 if dst_pkts == 0 else 56
            loss_rate = np.random.uniform(0.15, 0.65)
            
        elif label == "PortScan":
            # Systematic port probes: 1 packet sent per flow, duration nearly 0, no dst response
            proto = "tcp"
            service = "-"
            dst_port = int(np.random.choice([21, 22, 23, 25, 80, 110, 139, 443, 445, 1433, 3306, 3389, 8080]))
            duration = np.random.uniform(0.0001, 0.01)
            src_pkts = np.random.randint(1, 3)
            dst_pkts = np.random.choice([0, 1], p=[0.85, 0.15])
            src_bytes = src_pkts * 44  # SYN packet size
            dst_bytes = dst_pkts * 40  # RST or ACK
            src_ip = np.random.choice(external_ips)
            dst_ip = f"{internal_subnet}{np.random.randint(10, 50)}"
            sttl = np.random.choice([45, 52, 60])
            dttl = 0 if dst_pkts == 0 else 64
            loss_rate = 0.0
            
        elif label == "BruteForce":
            # Repeated login attempts on SSH/FTP with fixed payload chunks
            service = np.random.choice(["ssh", "ftp"], p=[0.7, 0.3])
            proto = "tcp"
            dst_port = 22 if service == "ssh" else 21
            duration = np.random.uniform(0.5, 3.5)
            src_pkts = np.random.randint(20, 70)
            dst_pkts = np.random.randint(15, 50)
            src_bytes = src_pkts * np.random.randint(90, 180)
            dst_bytes = dst_pkts * np.random.randint(80, 160)
            src_ip = np.random.choice(external_ips)
            dst_ip = f"{dmz_subnet}5"  # Specific bastion or auth server
            sttl = np.random.choice([50, 55, 118])
            dttl = 64
            loss_rate = np.random.uniform(0.0, 0.05)
            
        elif label == "Botnet":
            # C2 beaconing: regular small packet bursts, persistent interval, unusual high ports
            proto = "tcp"
            service = "ssl"
            dst_port = np.random.choice([443, 8443, 9001, 4444])
            duration = np.random.uniform(0.8, 2.2)
            src_pkts = np.random.randint(8, 25)
            dst_pkts = np.random.randint(6, 20)
            src_bytes = src_pkts * np.random.randint(120, 300)
            dst_bytes = dst_pkts * np.random.randint(100, 280)
            src_ip = f"{internal_subnet}{np.random.randint(80, 95)}"  # Compromised internal host
            dst_ip = np.random.choice(external_ips)  # C2 server
            sttl = 64
            dttl = 52
            loss_rate = np.random.uniform(0.0, 0.02)
            
        else:  # Exploits / Web Attack
            proto = "tcp"
            service = "http"
            dst_port = np.random.choice([80, 443, 8080])
            duration = np.random.uniform(0.2, 1.8)
            src_pkts = np.random.randint(12, 45)
            dst_pkts = np.random.randint(8, 30)
            src_bytes = src_pkts * np.random.randint(350, 950)  # Large HTTP injection payload
            dst_bytes = dst_pkts * np.random.randint(150, 500)
            src_ip = np.random.choice(external_ips)
            dst_ip = f"{dmz_subnet}3"  # Web application server
            sttl = np.random.choice([48, 54, 115])
            dttl = 64
            loss_rate = np.random.uniform(0.01, 0.08)
            
        src_port = np.random.randint(32768, 65535)
        
        # Derived rate metrics (safe from div by zero)
        eff_dur = max(duration, 0.0001)
        sload = (src_bytes * 8.0) / eff_dur
        dload = (dst_bytes * 8.0) / eff_dur
        
        records.append({
            "source_ip": src_ip,
            "destination_ip": dst_ip,
            "source_port": int(src_port),
            "destination_port": int(dst_port),
            "protocol": proto,
            "service": service,
            "duration": round(float(duration), 5),
            "src_bytes": int(src_bytes),
            "dst_bytes": int(dst_bytes),
            "src_pkts": int(src_pkts),
            "dst_pkts": int(dst_pkts),
            "sload": round(float(sload), 2),
            "dload": round(float(dload), 2),
            "sttl": int(sttl),
            "dttl": int(dttl),
            "loss_rate": round(float(loss_rate), 4),
            "label": label,
            "is_threat": 0 if label == "Benign" else 1
        })
        
    df = pd.DataFrame(records)
    return df


def prepare_and_split_data(
    df: pd.DataFrame,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Split data into train, validation, and test splits with stratified labels.
    """
    from sklearn.model_selection import train_test_split
    
    # First split off test set
    train_val_df, test_df = train_test_split(
        df,
        test_size=test_ratio,
        stratify=df["label"],
        random_state=random_state
    )
    
    # Split train and validation
    adjusted_val_ratio = val_ratio / (train_ratio + val_ratio)
    train_df, val_df = train_test_split(
        train_val_df,
        test_size=adjusted_val_ratio,
        stratify=train_val_df["label"],
        random_state=random_state
    )
    
    return train_df, val_df, test_df


def main():
    os.makedirs(DATASETS_DIR, exist_ok=True)
    os.makedirs(SAMPLE_DIR, exist_ok=True)
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    
    print("Generating statistical intrusion detection dataset...")
    df = generate_synthetic_flow_dataset(n_samples=20000, random_state=42)
    
    # Save full dataset
    full_csv = os.path.join(DATASETS_DIR, "intrusion_detection_benchmark.csv")
    df.to_csv(full_csv, index=False)
    print(f"Saved full benchmark dataset: {full_csv} ({len(df)} records)")
    
    # Perform stratified split
    train_df, val_df, test_df = prepare_and_split_data(df)
    
    train_csv = os.path.join(DATASETS_DIR, "train_flows.csv")
    val_csv = os.path.join(DATASETS_DIR, "val_flows.csv")
    test_csv = os.path.join(DATASETS_DIR, "test_flows.csv")
    
    train_df.to_csv(train_csv, index=False)
    val_df.to_csv(val_csv, index=False)
    test_df.to_csv(test_csv, index=False)
    
    print(f"Saved train set: {train_csv} ({len(train_df)} records)")
    print(f"Saved val set:   {val_csv} ({len(val_df)} records)")
    print(f"Saved test set:  {test_csv} ({len(test_df)} records)")
    
    # Create sample events file for demonstration / CSV upload / replay
    # Pick a balanced slice of 200 events (normal + various attacks)
    sample_df = test_df.groupby("label").apply(lambda x: x.head(35)).reset_index(drop=True)
    sample_csv = os.path.join(SAMPLE_DIR, "sample_events.csv")
    sample_json = os.path.join(SAMPLE_DIR, "sample_events.json")
    
    sample_df.to_csv(sample_csv, index=False)
    
    # Also save as structured JSON array of event dicts
    sample_events = sample_df.to_dict(orient="records")
    with open(sample_json, "w") as f:
        json.dump(sample_events, f, indent=2)
        
    print(f"Saved demo sample CSV: {sample_csv} ({len(sample_df)} records)")
    print(f"Saved demo sample JSON: {sample_json} ({len(sample_events)} records)")
    
    # Print label distribution
    print("\nDataset Class Distribution:")
    for label, count in df["label"].value_counts().items():
        print(f"  - {label:<12}: {count:>5} ({count/len(df)*100:.1f}%)")


if __name__ == "__main__":
    main()
