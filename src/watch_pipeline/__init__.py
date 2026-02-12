"""Pipeline modulaire: collecte -> normalisation -> déduplication -> enrichissement -> scoring -> stockage."""

from .pipeline import OpportunityPipeline

__all__ = ["OpportunityPipeline"]
