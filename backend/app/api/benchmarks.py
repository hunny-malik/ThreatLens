"""
ThreatLens Benchmarks & Evaluation API
Exposes verifiable model metrics, traditional vs platform comparison,
and single-node vs distributed scalability data.
"""
from fastapi import APIRouter
from typing import Dict, Any, List
from app.distributed.benchmarks import BenchmarkSuite
from app.models.schemas import ScalabilityBenchmark

router = APIRouter(prefix="/api/benchmarks", tags=["Benchmarks"])


@router.get("/scalability", response_model=List[ScalabilityBenchmark])
def get_scalability_benchmarks():
    return BenchmarkSuite.get_scalability_benchmarks()


@router.get("/evaluation")
def get_evaluation_metrics() -> Dict[str, Any]:
    return BenchmarkSuite.get_evaluation_metrics()
