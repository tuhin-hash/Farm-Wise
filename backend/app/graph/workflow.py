"""Multi-agent workflow orchestration using LangGraph with modular fallback runner."""
from __future__ import annotations

import time
import logging
from typing import Dict, Any, List

from app.graph.state import FarmWiseState
from app.agents import orchestrator, farm_data, nutrition, risk_environment, finance, decision

logger = logging.getLogger(__name__)

# Track whether LangGraph is available in current environment
LANGGRAPH_AVAILABLE = False
try:
    from langgraph.graph import StateGraph, START, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    logger.info("LangGraph package not found. Using built-in modular stateful runner.")


# ---------------------------------------------------------
# Node Functions (Compatible with both LangGraph & Fallback)
# ---------------------------------------------------------

def orchestrator_node(state: FarmWiseState) -> FarmWiseState:
    """Orchestrator node analyzes query and determines required agents."""
    query = state.get("query", "")
    farm_id = state.get("farm_id", "demo-farm-01")
    context = {
        "budget_inr": state.get("budget_inr", 5000),
        "farmer_strategy": state.get("farmer_strategy"),
        "priorities": state.get("priorities", {}),
    }
    
    result = orchestrator.run(query, farm_id, context)
    findings = result.get("findings", {})
    required = findings.get("required_agents", ["decision"])
    intents = findings.get("detected_intents", ["general_advice"])
    
    traces = list(state.get("execution_trace", []))
    traces.append({
        "agent_name": "orchestrator",
        "executed": True,
        "reason": "Analyzed query intent and planned agent execution route",
        "duration_ms": result.get("duration_ms", 0),
        "findings_summary": result.get("summary", ""),
    })
    
    agent_results = dict(state.get("agent_results", {}))
    agent_results["orchestrator"] = result
    
    return {
        **state,
        "intents": intents,
        "required_agents": required,
        "orchestrator_summary": result.get("summary", ""),
        "execution_trace": traces,
        "agent_results": agent_results,
    }


def farm_data_node(state: FarmWiseState) -> FarmWiseState:
    """Farm Data node executes if required by orchestrator."""
    required = state.get("required_agents", [])
    traces = list(state.get("execution_trace", []))
    agent_results = dict(state.get("agent_results", {}))
    
    if "farm_data" in required:
        farm_id = state.get("farm_id", "demo-farm-01")
        result = farm_data.run(farm_id)
        agent_results["farm_data"] = result
        traces.append({
            "agent_name": "farm_data",
            "executed": True,
            "reason": "Retrieved herd production, water intake, and animal flags",
            "duration_ms": result.get("duration_ms", 0),
            "findings_summary": result.get("summary", ""),
        })
    else:
        traces.append({
            "agent_name": "farm_data",
            "executed": False,
            "reason": "Skipped: not required for current query intent",
            "duration_ms": 0,
            "findings_summary": "Skipped by conditional router",
        })
        
    return {
        **state,
        "execution_trace": traces,
        "agent_results": agent_results,
    }


def nutrition_node(state: FarmWiseState) -> FarmWiseState:
    """Nutrition node executes if required by orchestrator."""
    required = state.get("required_agents", [])
    traces = list(state.get("execution_trace", []))
    agent_results = dict(state.get("agent_results", {}))
    
    if "nutrition" in required:
        farm_id = state.get("farm_id", "demo-farm-01")
        result = nutrition.run(farm_id)
        agent_results["nutrition"] = result
        traces.append({
            "agent_name": "nutrition",
            "executed": True,
            "reason": "Evaluated feed alternatives and nutritional differences",
            "duration_ms": result.get("duration_ms", 0),
            "findings_summary": result.get("summary", ""),
        })
    else:
        traces.append({
            "agent_name": "nutrition",
            "executed": False,
            "reason": "Skipped: not required for current query intent",
            "duration_ms": 0,
            "findings_summary": "Skipped by conditional router",
        })
        
    return {
        **state,
        "execution_trace": traces,
        "agent_results": agent_results,
    }


def risk_environment_node(state: FarmWiseState) -> FarmWiseState:
    """Risk & Environment node executes if required by orchestrator."""
    required = state.get("required_agents", [])
    traces = list(state.get("execution_trace", []))
    agent_results = dict(state.get("agent_results", {}))
    
    if "risk_environment" in required:
        farm_id = state.get("farm_id", "demo-farm-01")
        result = risk_environment.run(farm_id)
        agent_results["risk_environment"] = result
        traces.append({
            "agent_name": "risk_environment",
            "executed": True,
            "reason": "Assessed THI heat stress, water trends, and animal health alerts",
            "duration_ms": result.get("duration_ms", 0),
            "findings_summary": result.get("summary", ""),
        })
    else:
        traces.append({
            "agent_name": "risk_environment",
            "executed": False,
            "reason": "Skipped: not required for current query intent",
            "duration_ms": 0,
            "findings_summary": "Skipped by conditional router",
        })
        
    return {
        **state,
        "execution_trace": traces,
        "agent_results": agent_results,
    }


def finance_node(state: FarmWiseState) -> FarmWiseState:
    """Finance node executes deterministic calculations and scenario comparisons."""
    required = state.get("required_agents", [])
    traces = list(state.get("execution_trace", []))
    agent_results = dict(state.get("agent_results", {}))
    
    if "finance" in required:
        farm_id = state.get("farm_id", "demo-farm-01")
        query_context = {
            "budget_inr": state.get("budget_inr", 5000),
            "farmer_strategy": state.get("farmer_strategy"),
        }
        result = finance.run(farm_id, query_context)
        agent_results["finance"] = result
        traces.append({
            "agent_name": "finance",
            "executed": True,
            "reason": "Calculated costs, revenues, margins, and budget compliance",
            "duration_ms": result.get("duration_ms", 0),
            "findings_summary": result.get("summary", ""),
        })
    else:
        traces.append({
            "agent_name": "finance",
            "executed": False,
            "reason": "Skipped: not required for current query intent",
            "duration_ms": 0,
            "findings_summary": "Skipped by conditional router",
        })
        
    return {
        **state,
        "execution_trace": traces,
        "agent_results": agent_results,
    }


def decision_node(state: FarmWiseState) -> FarmWiseState:
    """Decision node compares candidate strategies, ranks them, and yields final recommendation."""
    traces = list(state.get("execution_trace", []))
    agent_results = dict(state.get("agent_results", {}))
    
    farm_id = state.get("farm_id", "demo-farm-01")
    query_context = {
        "budget_inr": state.get("budget_inr", 5000),
        "farmer_strategy": state.get("farmer_strategy"),
        "priorities": state.get("priorities", {}),
    }
    
    result = decision.run(farm_id, query_context, agent_results)
    agent_results["decision"] = result
    
    traces.append({
        "agent_name": "decision",
        "executed": True,
        "reason": "Evaluated candidate strategies in Decision Arena and computed ranking",
        "duration_ms": result.get("duration_ms", 0),
        "findings_summary": f"Recommended: {result.get('recommended_strategy_name')} (ID: {result.get('recommended_strategy_id')})",
    })
    
    return {
        **state,
        "execution_trace": traces,
        "agent_results": agent_results,
        "strategies": result.get("strategies", []),
        "scoring": result.get("ranking", []),
        "recommended_strategy_id": result.get("recommended_strategy_id", ""),
        "recommended_strategy_name": result.get("recommended_strategy_name", ""),
        "recommendation_explanation": result.get("explanation", ""),
        "assumptions": result.get("assumptions", []),
        "missing_data": result.get("missing_data", []),
        "safety_note": result.get("safety_note", ""),
    }


# ---------------------------------------------------------
# Graph Construction & Runners
# ---------------------------------------------------------

_compiled_graph = None

def get_compiled_graph():
    """Build and compile LangGraph if available."""
    global _compiled_graph
    if not LANGGRAPH_AVAILABLE:
        return None
    if _compiled_graph is not None:
        return _compiled_graph
        
    try:
        builder = StateGraph(FarmWiseState)
        
        # Add nodes
        builder.add_node("orchestrator", orchestrator_node)
        builder.add_node("farm_data", farm_data_node)
        builder.add_node("nutrition", nutrition_node)
        builder.add_node("risk_environment", risk_environment_node)
        builder.add_node("finance", finance_node)
        builder.add_node("decision", decision_node)
        
        # Edges
        builder.add_edge(START, "orchestrator")
        builder.add_edge("orchestrator", "farm_data")
        builder.add_edge("farm_data", "nutrition")
        builder.add_edge("nutrition", "risk_environment")
        builder.add_edge("risk_environment", "finance")
        builder.add_edge("finance", "decision")
        builder.add_edge("decision", END)
        
        _compiled_graph = builder.compile()
        return _compiled_graph
    except Exception as e:
        logger.warning(f"Error compiling LangGraph: {e}. Falling back to modular runner.")
        return None


def run_fallback_workflow(initial_state: FarmWiseState) -> FarmWiseState:
    """Deterministic, modular stateful runner as fallback or when LangGraph is absent."""
    state = dict(initial_state)
    
    # 1. Orchestrator
    state = orchestrator_node(state)
    
    # 2. Sequential conditionally-filtered nodes
    state = farm_data_node(state)
    state = nutrition_node(state)
    state = risk_environment_node(state)
    state = finance_node(state)
    
    # 3. Decision Node
    state = decision_node(state)
    
    return state


def run_farmwise_workflow(initial_state: FarmWiseState) -> FarmWiseState:
    """Unified entrypoint for running the FarmWise multi-agent workflow."""
    graph = get_compiled_graph()
    if graph is not None:
        try:
            return graph.invoke(initial_state)
        except Exception as e:
            logger.warning(f"LangGraph execution error: {e}. Executing fallback runner.")
            return run_fallback_workflow(initial_state)
    else:
        return run_fallback_workflow(initial_state)
