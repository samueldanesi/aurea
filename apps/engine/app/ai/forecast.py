def forecast_linear(series: list[float], periods_ahead: int = 3) -> list[float]:
    """
    Baseline forecast: ordinary least squares over the period index. Intentionally
    simple (no seasonality, no confidence intervals) -- a starting point for
    "proiezione fatturato prossimo trimestre" that's cheap and dependency-free.
    Swap for a proper time-series model (Prophet, ETS) in phase 2 once there's
    enough per-tenant history for seasonality to matter; see docs/ROADMAP.md.
    """
    n = len(series)
    if n < 3:
        return [series[-1]] * periods_ahead if series else [0.0] * periods_ahead

    x_mean = (n - 1) / 2
    y_mean = sum(series) / n
    numerator = sum((i - x_mean) * (y - y_mean) for i, y in enumerate(series))
    denominator = sum((i - x_mean) ** 2 for i in range(n)) or 1
    slope = numerator / denominator
    intercept = y_mean - slope * x_mean

    return [intercept + slope * (n - 1 + step) for step in range(1, periods_ahead + 1)]
