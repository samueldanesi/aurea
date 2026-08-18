import statistics


def detect_anomalies(series: list[float], z_threshold: float = 2.5) -> list[int]:
    """
    Baseline anomaly detection: flags points more than `z_threshold` standard
    deviations from the series mean. Deliberately simple (no seasonality
    modeling, no learned model) so it's cheap to run on every KPI on a schedule;
    see docs/ROADMAP.md for the phase-2 upgrade path (STL decomposition /
    Prophet-style seasonal models) once there's enough tenant history to justify it.
    Returns indices into `series` that are anomalous.
    """
    if len(series) < 5:
        return []
    mean = statistics.fmean(series)
    stdev = statistics.pstdev(series)
    if stdev == 0:
        return []
    return [i for i, v in enumerate(series) if abs(v - mean) / stdev > z_threshold]
