"""
generate_dataset.py — Synthetic dataset generator for ZerithDB load testing
Issue: #123 | Author: topshe23

Usage:
    python scripts/generate_dataset.py --type users --count 10000
    python scripts/generate_dataset.py --type all --count 100000 --format jsonl
    python scripts/generate_dataset.py --type transactions --count 50000 --skew high --seed 99
    python scripts/generate_dataset.py --type products --count 5000 --skew bimodal --output ./datasets

Requirements:
    pip install -r scripts/requirements.txt
"""

import argparse
import json
import random
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

try:
    from faker import Faker
except ImportError:
    print("ERROR: 'faker' is not installed. Run: pip install -r scripts/requirements.txt")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Distribution helpers
# ---------------------------------------------------------------------------

def skewed_int(lo: int, hi: int, skew: str = "none") -> int:
    """
    Return an integer between lo and hi with optional distribution skew.

    skew='none'    — uniform random
    skew='low'     — most values cluster near lo  (sparse/inactive data)
    skew='high'    — most values cluster near hi  (heavy usage)
    skew='bimodal' — values cluster at both ends  (power users vs inactive)
    """
    if skew == "low":
        return int(lo + (hi - lo) * (random.betavariate(1, 5)))
    elif skew == "high":
        return int(lo + (hi - lo) * (random.betavariate(5, 1)))
    elif skew == "bimodal":
        if random.random() < 0.5:
            return int(lo + (hi - lo) * (random.betavariate(1, 4)))
        else:
            return int(lo + (hi - lo) * (random.betavariate(4, 1)))
    else:
        return random.randint(lo, hi)


def skewed_choice(options: list, skew: str = "none"):
    """Pick from a list with optional skew toward first or last items."""
    if skew == "low":
        weights = [len(options) - i for i in range(len(options))]
    elif skew == "high":
        weights = [i + 1 for i in range(len(options))]
    else:
        return random.choice(options)
    return random.choices(options, weights=weights, k=1)[0]


def random_past_datetime(days_back: int = 365) -> str:
    delta = timedelta(
        days=random.randint(0, days_back),
        seconds=random.randint(0, 86400),
    )
    return (datetime.now() - delta).isoformat() + "Z"


# ---------------------------------------------------------------------------
# Record generators
# ---------------------------------------------------------------------------

STATUSES   = ["active", "inactive", "banned", "pending"]
ROLES      = ["user", "admin", "moderator", "viewer"]
TAGS       = ["tech", "sports", "music", "travel", "food", "gaming", "art", "science"]
CATEGORIES = ["Electronics", "Clothing", "Books", "Home", "Sports", "Toys", "Food", "Beauty"]
CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "AUD"]
TX_TYPES   = ["purchase", "refund", "transfer", "deposit", "withdrawal"]
TX_STATUS  = ["completed", "pending", "failed", "reversed"]


def make_user(fake: Faker, skew: str = "none") -> dict:
    return {
        "id": fake.uuid4(),
        "username": fake.user_name(),
        "email": fake.email(),
        "fullName": fake.name(),
        "age": skewed_int(18, 80, skew),
        "role": skewed_choice(ROLES, skew),
        "status": skewed_choice(STATUSES, skew),
        "country": fake.country_code(),
        "city": fake.city(),
        "bio": fake.sentence(nb_words=12),
        "avatarUrl": fake.image_url(),
        "tags": random.sample(TAGS, k=skewed_int(1, 4, skew)),
        "loginCount": skewed_int(0, 5000, skew),
        "storageUsedBytes": skewed_int(0, 10_000_000, skew),
        "createdAt": random_past_datetime(730),
        "lastSeenAt": random_past_datetime(30),
        "isVerified": random.random() > 0.3,
        "preferences": {
            "theme": random.choice(["light", "dark", "system"]),
            "language": fake.language_code(),
            "notifications": random.choice([True, False]),
        },
    }


def make_product(fake: Faker, skew: str = "none") -> dict:
    price    = round(random.uniform(0.99, 9999.99), 2)
    discount = round(random.uniform(0, 0.5), 2) if random.random() > 0.6 else 0.0
    return {
        "id": fake.uuid4(),
        "sku": fake.bothify(text="??-#####-??").upper(),
        "name": fake.catch_phrase(),
        "description": fake.paragraph(nb_sentences=3),
        "category": skewed_choice(CATEGORIES, skew),
        "brand": fake.company(),
        "price": price,
        "discountRate": discount,
        "finalPrice": round(price * (1 - discount), 2),
        "currency": skewed_choice(CURRENCIES, skew),
        "stock": skewed_int(0, 10000, skew),
        "rating": round(random.uniform(1.0, 5.0), 1),
        "reviewCount": skewed_int(0, 50000, skew),
        "tags": random.sample(TAGS, k=skewed_int(1, 5, skew)),
        "isActive": random.random() > 0.1,
        "isFeatured": random.random() > 0.8,
        "weight": round(random.uniform(0.1, 50.0), 2),
        "dimensions": {
            "length": round(random.uniform(1, 200), 1),
            "width": round(random.uniform(1, 200), 1),
            "height": round(random.uniform(1, 200), 1),
            "unit": "cm",
        },
        "createdAt": random_past_datetime(1000),
        "updatedAt": random_past_datetime(30),
    }


def make_transaction(fake: Faker, skew: str = "none") -> dict:
    amount = round(random.uniform(0.01, 100_000.0), 2)
    return {
        "id": fake.uuid4(),
        "referenceId": fake.bothify(text="TXN-########"),
        "type": skewed_choice(TX_TYPES, skew),
        "status": skewed_choice(TX_STATUS, skew),
        "amount": amount,
        "currency": skewed_choice(CURRENCIES, skew),
        "fee": round(amount * random.uniform(0, 0.03), 4),
        "senderId": fake.uuid4(),
        "receiverId": fake.uuid4(),
        "senderCountry": fake.country_code(),
        "receiverCountry": fake.country_code(),
        "description": fake.sentence(nb_words=8),
        "tags": random.sample(TAGS, k=skewed_int(0, 3, skew)),
        "metadata": {
            "ipAddress": fake.ipv4(),
            "userAgent": fake.user_agent(),
            "deviceId": fake.md5(),
        },
        "createdAt": random_past_datetime(365),
        "settledAt": random_past_datetime(360) if random.random() > 0.2 else None,
        "retryCount": skewed_int(0, 5, skew),
        "isDisputed": random.random() > 0.95,
    }


# ---------------------------------------------------------------------------
# Generator registry
# ---------------------------------------------------------------------------

GENERATORS = {
    "users":        make_user,
    "products":     make_product,
    "transactions": make_transaction,
}


# ---------------------------------------------------------------------------
# Core generation — incremental writes, memory-safe for any --count value
# ---------------------------------------------------------------------------

def generate(
    kind: str,
    count: int,
    skew: str,
    output_dir: Path,
    fmt: str,
    fake: Faker,
) -> Path:
    gen_fn = GENERATORS[kind]
    output_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%dT%H%M%S")
    ext       = "jsonl" if fmt == "jsonl" else "json"
    filename  = output_dir / f"{kind}_{count}_{skew}_{timestamp}.{ext}"

    print(f"  Generating {count:,} {kind} records  [skew={skew}, format={fmt}] ...", end="", flush=True)
    t0 = time.perf_counter()

    with open(filename, "w", encoding="utf-8") as f:
        if fmt == "jsonl":
            # One JSON object per line — streamable and memory-safe
            for _ in range(count):
                record = gen_fn(fake, skew)
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
        else:
            # Incremental JSON array — never holds full list in RAM
            f.write("[\n")
            for i in range(count):
                record = gen_fn(fake, skew)
                comma  = "" if i == count - 1 else ","
                f.write("  " + json.dumps(record, ensure_ascii=False) + comma + "\n")
            f.write("]\n")

    elapsed = time.perf_counter() - t0
    size_mb = filename.stat().st_size / (1024 * 1024)
    print(f" done in {elapsed:.2f}s  ({size_mb:.2f} MB)")
    print(f"    → {filename}")

    return filename


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Synthetic dataset generator for ZerithDB load testing",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/generate_dataset.py --type users --count 10000
  python scripts/generate_dataset.py --type transactions --count 100000 --skew high
  python scripts/generate_dataset.py --type all --count 50000 --format jsonl
  python scripts/generate_dataset.py --type products --count 5000 --seed 99 --output ./my_data
        """,
    )
    parser.add_argument(
        "--type", "-t",
        choices=list(GENERATORS.keys()) + ["all"],
        required=True,
        help="Type of dataset to generate (or 'all' for every type)",
    )
    parser.add_argument(
        "--count", "-c",
        type=int,
        default=10_000,
        help="Number of records to generate (default: 10000)",
    )
    parser.add_argument(
        "--skew", "-s",
        choices=["none", "low", "high", "bimodal"],
        default="none",
        help=(
            "Distribution skew: 'none'=uniform | 'low'=sparse | "
            "'high'=heavy usage | 'bimodal'=power-user split (default: none)"
        ),
    )
    parser.add_argument(
        "--format", "-f",
        choices=["json", "jsonl"],
        default="json",
        help=(
            "Output format: 'json'=JSON array | 'jsonl'=JSON Lines "
            "one record per line, better for streaming large datasets (default: json)"
        ),
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducible output (default: 42, change for different variations)",
    )
    parser.add_argument(
        "--output", "-o",
        type=Path,
        default=Path("./datasets"),
        help="Output directory for generated files (default: ./datasets)",
    )
    return parser


def main():
    parser = build_parser()
    args   = parser.parse_args()

    if args.count < 1:
        parser.error("--count must be at least 1")

    # Seed both faker and random — changing --seed gives different reproducible runs
    Faker.seed(args.seed)
    random.seed(args.seed)
    fake = Faker()

    kinds = list(GENERATORS.keys()) if args.type == "all" else [args.type]

    print("\n🗄️  ZerithDB — Synthetic Dataset Generator")
    print(f"   Types   : {', '.join(kinds)}")
    print(f"   Count   : {args.count:,} records each")
    print(f"   Skew    : {args.skew}")
    print(f"   Format  : {args.format}")
    print(f"   Seed    : {args.seed}")
    print(f"   Output  : {args.output.resolve()}\n")

    total_start = time.perf_counter()
    generated   = []

    for kind in kinds:
        path = generate(kind, args.count, args.skew, args.output, args.format, fake)
        generated.append(path)

    total_elapsed = time.perf_counter() - total_start
    total_records = args.count * len(kinds)
    total_mb      = sum(p.stat().st_size for p in generated) / (1024 * 1024)

    print(f"\n✅  Done — {total_records:,} records | {total_mb:.2f} MB | {total_elapsed:.2f}s total")
    print(f"   Files saved to: {args.output.resolve()}\n")


if __name__ == "__main__":
    main()