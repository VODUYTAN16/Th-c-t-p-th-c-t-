"""LangGraph orchestration for document and evaluation pipelines."""

from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.agents.document_parser_agent import parse_documents
from app.agents.evaluator_agent import evaluate_session
from app.agents.question_generator_agent import generate_questions


class ParseState(TypedDict):
    session_id: str
    cv_text: str
    jd_text: str | None
    position: str
    industry: str | None
    language: str
    profile: dict | None


async def node_parse(state: ParseState) -> ParseState:
    profile = await parse_documents(
        state["session_id"],
        state["cv_text"],
        state["jd_text"],
        state["position"],
        state["industry"],
    )
    return {**state, "profile": profile}


async def node_generate_questions(state: ParseState) -> ParseState:
    await generate_questions(
        state["session_id"],
        state["profile"] or {},
        state["position"],
        state["industry"],
        state["language"],
    )
    return state


def build_parse_graph():
    graph = StateGraph(ParseState)
    graph.add_node("parse", node_parse)
    graph.add_node("generate_questions", node_generate_questions)
    graph.set_entry_point("parse")
    graph.add_edge("parse", "generate_questions")
    graph.add_edge("generate_questions", END)
    return graph.compile()


class EvalState(TypedDict):
    session_id: str
    result: dict | None


async def node_evaluate(state: EvalState) -> EvalState:
    result = await evaluate_session(state["session_id"])
    return {**state, "result": result}


def build_eval_graph():
    graph = StateGraph(EvalState)
    graph.add_node("evaluate", node_evaluate)
    graph.set_entry_point("evaluate")
    graph.add_edge("evaluate", END)
    return graph.compile()
