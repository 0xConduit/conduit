// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.13;

contract Conduit {
    enum Chain {
        BASE,
        HEDERA,
        ZEROG
    }
    enum Ability {
        PERCEPTION_VISUAL_RECOGNITION,
        PERCEPTION_OBJECT_DETECTION,
        PERCEPTION_FACE_RECOGNITION,
        PERCEPTION_SCENE_UNDERSTANDING,
        PERCEPTION_TEXT_IN_IMAGES,
        PERCEPTION_HANDWRITING_RECOGNITION,
        PERCEPTION_DOCUMENT_LAYOUT_PARSING,
        PERCEPTION_CHART_UNDERSTANDING,
        PERCEPTION_TABLE_EXTRACTION,
        PERCEPTION_AUDIO_TRANSCRIPTION,
        PERCEPTION_SPEAKER_DIARIZATION,
        PERCEPTION_EMOTION_FROM_VOICE,
        PERCEPTION_SOUND_EVENT_DETECTION,
        PERCEPTION_MUSIC_ANALYSIS,
        PERCEPTION_LANGUAGE_IDENTIFICATION,
        PERCEPTION_ACCENT_DETECTION,
        PERCEPTION_VIDEO_SUMMARIZATION,
        PERCEPTION_ACTION_RECOGNITION,
        PERCEPTION_GESTURE_RECOGNITION,
        PERCEPTION_POSE_ESTIMATION,
        PERCEPTION_DEPTH_ESTIMATION,
        PERCEPTION_OPTICAL_FLOW_TRACKING,
        PERCEPTION_OBJECT_TRACKING,
        PERCEPTION_ANOMALY_DETECTION,
        PERCEPTION_SENSOR_FUSION,
        PERCEPTION_TIME_SERIES_SENSING,
        PERCEPTION_SPATIAL_MAPPING,
        PERCEPTION_SEMANTIC_SEGMENTATION,
        PERCEPTION_INSTANCE_SEGMENTATION,
        PERCEPTION_MULTIMODAL_ALIGNMENT,
        PERCEPTION_ATTENTION_FOCUSING,
        PERCEPTION_UNCERTAINTY_ESTIMATION,
        LANGUAGE_TEXT_GENERATION,
        LANGUAGE_SUMMARIZATION,
        LANGUAGE_PARAPHRASING,
        LANGUAGE_TRANSLATION,
        LANGUAGE_STYLE_TRANSFER,
        LANGUAGE_TONE_CONTROL,
        LANGUAGE_GRAMMAR_CORRECTION,
        LANGUAGE_SPELLING_CORRECTION,
        LANGUAGE_INFORMATION_EXTRACTION,
        LANGUAGE_ENTITY_LINKING,
        LANGUAGE_QUESTION_ANSWERING,
        LANGUAGE_RETRIEVAL_AUGMENTED_ANSWERING,
        LANGUAGE_DIALOGUE_MANAGEMENT,
        LANGUAGE_CONTEXT_TRACKING,
        LANGUAGE_INTENT_CLASSIFICATION,
        LANGUAGE_SLOT_FILLING,
        LANGUAGE_SEMANTIC_PARSING,
        LANGUAGE_LOGICAL_FORM_GENERATION,
        LANGUAGE_ARGUMENT_MINING,
        LANGUAGE_SENTIMENT_ANALYSIS,
        LANGUAGE_TOPIC_MODELING,
        LANGUAGE_KEYWORD_EXTRACTION,
        LANGUAGE_DOCUMENT_CLASSIFICATION,
        LANGUAGE_SAFETY_REFUSAL_GENERATION,
        LANGUAGE_PROMPT_FOLLOWING,
        LANGUAGE_INSTRUCTION_DECOMPOSITION,
        LANGUAGE_PLAN_EXPLANATION,
        LANGUAGE_CITATION_FORMATTING,
        LANGUAGE_REFERENCE_RESOLUTION,
        LANGUAGE_CONVERSATION_SUMMARIZATION,
        LANGUAGE_TERMINOLOGY_CONSISTENCY,
        LANGUAGE_MULTILINGUAL_DIALOGUE,
        REASONING_DEDUCTIVE_REASONING,
        REASONING_INDUCTIVE_REASONING,
        REASONING_ABDUCTIVE_REASONING,
        REASONING_CAUSAL_REASONING,
        REASONING_COUNTERFACTUAL_REASONING,
        REASONING_ANALOGICAL_REASONING,
        REASONING_MATHEMATICAL_REASONING,
        REASONING_SYMBOLIC_REASONING,
        REASONING_PROBABILISTIC_REASONING,
        REASONING_BAYESIAN_UPDATING,
        REASONING_CONSTRAINT_SOLVING,
        REASONING_OPTIMIZATION,
        REASONING_GAME_THEORETIC_REASONING,
        REASONING_STRATEGIC_REASONING,
        REASONING_GOAL_RECOGNITION,
        REASONING_BELIEF_MODELING,
        REASONING_THEORY_OF_MIND,
        REASONING_RISK_ASSESSMENT,
        REASONING_COST_BENEFIT_ANALYSIS,
        REASONING_TRADEOFF_ANALYSIS,
        REASONING_ERROR_DETECTION,
        REASONING_SELF_CONSISTENCY_CHECKING,
        REASONING_FACT_CHECKING_INTERNAL,
        REASONING_CONTRADICTION_DETECTION,
        REASONING_HYPOTHESIS_GENERATION,
        REASONING_EXPERIMENT_DESIGN,
        REASONING_MODEL_SELECTION,
        REASONING_OUTLIER_REASONING,
        REASONING_STATISTICAL_INFERENCE,
        REASONING_EVIDENCE_WEIGHING,
        REASONING_MULTI_STEP_REASONING,
        REASONING_META_REASONING,
        PLANNING_TASK_DECOMPOSITION,
        PLANNING_GOAL_SETTING,
        PLANNING_PRIORITIZATION,
        PLANNING_SCHEDULING,
        PLANNING_RESOURCE_ALLOCATION,
        PLANNING_PATH_PLANNING,
        PLANNING_WORKFLOW_DESIGN,
        PLANNING_CHECKLIST_GENERATION,
        PLANNING_MILESTONE_TRACKING,
        PLANNING_DEPENDENCY_MANAGEMENT,
        PLANNING_BACKTRACKING,
        PLANNING_CONTINGENCY_PLANNING,
        PLANNING_ROBUST_PLANNING,
        PLANNING_REPLANNING,
        PLANNING_EXPLORATION_PLANNING,
        PLANNING_EXPLOITATION_PLANNING,
        PLANNING_LONG_HORIZON_PLANNING,
        PLANNING_SHORT_HORIZON_CONTROL,
        PLANNING_ITERATIVE_REFINEMENT,
        PLANNING_CONSTRAINT_AWARE_PLANNING,
        PLANNING_DEADLINE_MANAGEMENT,
        PLANNING_TIME_BUDGETING,
        PLANNING_PROGRESS_ESTIMATION,
        PLANNING_STOPPING_CRITERIA,
        PLANNING_MULTI_AGENT_COORDINATION,
        PLANNING_ROLE_ASSIGNMENT,
        PLANNING_DELEGATION,
        PLANNING_ESCALATION_HANDLING,
        PLANNING_APPROVAL_GATING,
        PLANNING_AUDIT_TRAIL_PLANNING,
        PLANNING_PLAN_SERIALIZATION,
        PLANNING_PLAN_VALIDATION,
        TOOL_USE_WEB_SEARCH,
        TOOL_USE_DATABASE_QUERYING,
        TOOL_USE_SPREADSHEET_EDITING,
        TOOL_USE_DOCUMENT_EDITING,
        TOOL_USE_EMAIL_DRAFTING,
        TOOL_USE_CALENDAR_PLANNING,
        TOOL_USE_CODE_GENERATION,
        TOOL_USE_CODE_REFACTORING,
        TOOL_USE_TEST_GENERATION,
        TOOL_USE_DEBUGGING,
        TOOL_USE_STATIC_ANALYSIS,
        TOOL_USE_LOG_ANALYSIS,
        TOOL_USE_API_CALLING,
        TOOL_USE_DATA_CLEANING,
        TOOL_USE_DATA_VISUALIZATION,
        TOOL_USE_REPORT_GENERATION,
        TOOL_USE_FILE_MANAGEMENT,
        TOOL_USE_VERSION_CONTROL,
        TOOL_USE_CICD_ORCHESTRATION,
        TOOL_USE_CONTAINER_OPERATIONS,
        TOOL_USE_CLOUD_OPERATIONS,
        TOOL_USE_MONITORING_ALERTS,
        TOOL_USE_WEB_AUTOMATION,
        TOOL_USE_FORM_FILLING,
        TOOL_USE_IMAGE_GENERATION,
        TOOL_USE_IMAGE_EDITING,
        TOOL_USE_AUDIO_SYNTHESIS,
        TOOL_USE_VIDEO_EDITING,
        TOOL_USE_ROBOT_CONTROL,
        TOOL_USE_IOT_CONTROL,
        TOOL_USE_SIMULATION_CONTROL,
        TOOL_USE_BATCH_PROCESSING,
        MEMORY_SHORT_TERM_MEMORY,
        MEMORY_LONG_TERM_MEMORY,
        MEMORY_EPISODIC_RECALL,
        MEMORY_SEMANTIC_RECALL,
        MEMORY_WORKING_MEMORY_MANAGEMENT,
        MEMORY_CONTEXT_COMPRESSION,
        MEMORY_KNOWLEDGE_GRAPH_BUILDING,
        MEMORY_INDEX_CONSTRUCTION,
        MEMORY_RETRIEVAL_RANKING,
        MEMORY_QUERY_REWRITING,
        MEMORY_DEDUPLICATION,
        MEMORY_CLUSTERING,
        MEMORY_TAGGING,
        MEMORY_ONTOLOGY_ALIGNMENT,
        MEMORY_TAXONOMY_BUILDING,
        MEMORY_PROFILE_MODELING,
        MEMORY_PREFERENCE_LEARNING,
        MEMORY_PERSONALIZATION,
        MEMORY_FEW_SHOT_ADAPTATION,
        MEMORY_CONTINUAL_LEARNING,
        MEMORY_CATASTROPHIC_FORGETTING_AVOIDANCE,
        MEMORY_SOURCE_ATTRIBUTION,
        MEMORY_PROVENANCE_TRACKING,
        MEMORY_KNOWLEDGE_VALIDATION,
        MEMORY_KNOWLEDGE_UPDATING,
        MEMORY_STALENESS_DETECTION,
        MEMORY_CACHE_MANAGEMENT,
        MEMORY_SUMMARIZED_MEMORY_WRITES,
        MEMORY_SENSITIVE_INFO_FILTERING,
        MEMORY_REDACTION,
        MEMORY_DATA_MINIMIZATION,
        MEMORY_CONSENT_AWARE_STORAGE,
        INTERACTION_POLITE_TURN_TAKING,
        INTERACTION_CLARIFYING_QUESTIONS,
        INTERACTION_ACTIVE_LISTENING,
        INTERACTION_EMPATHY_EXPRESSION,
        INTERACTION_NEGOTIATION,
        INTERACTION_PERSUASION,
        INTERACTION_CONFLICT_RESOLUTION,
        INTERACTION_COACHING,
        INTERACTION_TUTORING,
        INTERACTION_FEEDBACK_INCORPORATION,
        INTERACTION_REQUIREMENT_ELICITATION,
        INTERACTION_STAKEHOLDER_ALIGNMENT,
        INTERACTION_MEETING_FACILITATION,
        INTERACTION_BRAINSTORMING,
        INTERACTION_IDEA_EVALUATION,
        INTERACTION_CREATIVE_WRITING,
        INTERACTION_HUMOR_GENERATION,
        INTERACTION_STORYTELLING,
        INTERACTION_PRESENTATION_DRAFTING,
        INTERACTION_SLIDE_OUTLINING,
        INTERACTION_PROMPT_ENGINEERING_ASSISTANCE,
        INTERACTION_USER_MODEL_UPDATING,
        INTERACTION_TRUST_CALIBRATION,
        INTERACTION_TRANSPARENCY_EXPLANATIONS,
        INTERACTION_REFUSAL_WITH_ALTERNATIVES,
        INTERACTION_SAFETY_BOUNDARY_SETTING,
        INTERACTION_MULTI_PARTY_MEDIATION,
        INTERACTION_COLLABORATION_HANDOFF,
        INTERACTION_TASK_STATUS_REPORTING,
        INTERACTION_PROGRESS_SUMMARIES,
        INTERACTION_CHANGE_MANAGEMENT,
        INTERACTION_EXPECTATION_SETTING,
        SAFETY_PII_RECOGNITION,
        SAFETY_PII_AVOIDANCE,
        SAFETY_DATA_LEAK_PREVENTION,
        SAFETY_PROMPT_INJECTION_RESISTANCE,
        SAFETY_JAILBREAK_RESISTANCE,
        SAFETY_MALWARE_AVOIDANCE,
        SAFETY_FRAUD_DETECTION,
        SAFETY_SCAM_AVOIDANCE,
        SAFETY_HATE_HARASSMENT_MITIGATION,
        SAFETY_SELF_HARM_CRISIS_ROUTING,
        SAFETY_VIOLENCE_POLICY_COMPLIANCE,
        SAFETY_EXPLICIT_CONTENT_POLICY_COMPLIANCE,
        SAFETY_COPYRIGHT_COMPLIANCE,
        SAFETY_LEGAL_RISK_FLAGGING,
        SAFETY_MEDICAL_RISK_FLAGGING,
        SAFETY_FINANCIAL_RISK_FLAGGING,
        SAFETY_OPERATIONAL_SAFETY_CHECKS,
        SAFETY_RATE_LIMITING,
        SAFETY_RETRY_BACKOFF,
        SAFETY_IDEMPOTENCY_HANDLING,
        SAFETY_FALLBACK_STRATEGIES,
        SAFETY_OBSERVABILITY_HOOKS,
        SAFETY_AUDIT_LOGGING,
        SAFETY_DETERMINISM_MODE,
        SAFETY_ROBUST_PARSING,
        SAFETY_INPUT_VALIDATION,
        SAFETY_OUTPUT_VALIDATION,
        SAFETY_ADVERSARIAL_TESTING,
        SAFETY_RED_TEAM_SIMULATION,
        SAFETY_INCIDENT_RESPONSE,
        SAFETY_MODEL_DRIFT_MONITORING,
        SAFETY_GOVERNANCE_CONTROLS
    }

    struct Agent {
        bytes32 name;
        uint256 price;
        uint256 reputation;
        uint256 abilities;
        Chain chain;
        bool exists;
    }

    struct Job {
        address agent;
        address renter;
        uint256 amount;
        bool accepted;
        bool rejected;
        bool completed;
    }

    mapping(address => Agent) public agents;
    mapping(uint256 => Job) public jobs;

    event AgentRegistered(address indexed agent, bytes32 name, Chain chain, uint256 price, uint256 abilities);
    event AgentUpdated(address indexed agent, bytes32 name, Chain chain, uint256 price, uint256 abilities);
    event AgentDeregistered(address indexed agent);
    event JobCreated(uint256 indexed id, address indexed agent, address indexed renter, uint256 mins, uint256 amount);
    event JobAccepted(uint256 indexed id);
    event JobRejected(uint256 indexed id);
    event JobCompleted(uint256 indexed id);
    event JobRefunded(uint256 indexed id);

    uint256 counter = 0;

    function _bit(Ability ability) internal pure returns (uint256) {
        uint256 a = uint256(ability);
        require(a < 256, "Invalid ability");
        return 1 << a;
    }

    function _addAbility(address agent, Ability ability) internal {
        agents[agent].abilities |= _bit(ability);
    }

    function _setAbilities(address agent, uint256 mask) internal {
        agents[agent].abilities = mask;
    }

    function _removeAbility(address agent, Ability ability) internal {
        agents[agent].abilities &= ~_bit(ability);
    }

    function _clearAbilities(address agent) internal {
        agents[agent].abilities = 0;
    }

    function _hasAbility(address agent, Ability ability) internal view returns (bool) {
        return (agents[agent].abilities & _bit(ability)) != 0;
    }

    function _hasAllAbilities(address agent, uint256 mask) internal view returns (bool) {
        return (agents[agent].abilities & mask) == mask;
    }

    function _hasAnyAbilities(address agent, uint256 mask) internal view returns (bool) {
        return (agents[agent].abilities & mask) != 0;
    }

    function register(bytes32 name, Chain chain, uint256 price, uint256 abilities) public {
        require(name != bytes32(0), "Invalid name");
        Agent storage agent = agents[msg.sender];
        require(!agent.exists, "Agent is already registered");
        agent.exists = true;
        agent.name = name;
        agent.chain = chain;
        agent.price = price;
        agent.reputation = 0;
        agent.abilities = abilities;
        emit AgentRegistered(msg.sender, name, chain, price, abilities);
    }

    function updateName(bytes32 name) public {
        require(name != bytes32(0), "Invalid name");
        Agent storage agent = agents[msg.sender];
        require(agent.exists, "Agent is not registered");
        agent.name = name;
        emit AgentUpdated(msg.sender, name, agent.chain, agent.price, agent.abilities);
    }

    function updateChain(Chain chain) public {
        Agent storage agent = agents[msg.sender];
        require(agent.exists, "Agent is not registered");
        agent.chain = chain;
        emit AgentUpdated(msg.sender, agent.name, chain, agent.price, agent.abilities);
    }

    function updatePrice(uint256 price) public {
        Agent storage agent = agents[msg.sender];
        require(agent.exists, "Agent is not registered");
        agent.price = price;
        emit AgentUpdated(msg.sender, agent.name, agent.chain, price, agent.abilities);
    }

    function updateAbilities(uint256 abilities) public {
        Agent storage agent = agents[msg.sender];
        require(agent.exists, "Agent is not registered");
        agent.abilities = abilities;
        emit AgentUpdated(msg.sender, agent.name, agent.chain, agent.price, abilities);
    }

    function addAbility(Ability ability) public {
        Agent storage agent = agents[msg.sender];
        require(agent.exists, "Agent is not registered");
        _addAbility(msg.sender, ability);
        emit AgentUpdated(msg.sender, agent.name, agent.chain, agent.price, agent.abilities);
    }

    function removeAbility(Ability ability) public {
        Agent storage agent = agents[msg.sender];
        require(agent.exists, "Agent is not registered");
        _removeAbility(msg.sender, ability);
        emit AgentUpdated(msg.sender, agent.name, agent.chain, agent.price, agent.abilities);
    }

    function deregister() public {
        Agent storage agent = agents[msg.sender];
        require(agent.exists, "Agent is not registered");
        delete agents[msg.sender];
        emit AgentDeregistered(msg.sender);
    }

    function rentAgent(address agent_, uint256 mins) public payable returns (uint256) {
        Agent storage agent = agents[agent_];
        require(agent.exists, "Agent is not registered");
        uint256 amount = agent.price * mins;
        require(msg.value >= amount, "Insufficient funds");
        Job storage job = jobs[counter];
        job.agent = agent_;
        job.renter = msg.sender;
        job.amount = amount;
        job.accepted = false;
        job.rejected = false;
        job.completed = false;
        counter++;
        emit JobCreated(counter - 1, agent_, msg.sender, mins, amount);
        uint256 refund = msg.value - amount;
        if (refund > 0) {
            (bool ok,) = payable(msg.sender).call{value: refund}("");
            require(ok, "Failed to refund excess payment");
        }
        return counter - 1;
    }

    function acceptJob(uint256 id) public {
        require(id < counter, "Invalid job");
        Job storage job = jobs[id];
        require(msg.sender == job.agent, "Agent does not have access to this job");
        require(!job.accepted, "Job already accepted");
        require(!job.rejected, "Job already rejected");
        require(!job.completed, "Job already completed");
        job.accepted = true;
        emit JobAccepted(id);
    }

    function rejectJob(uint256 id) public {
        require(id < counter, "Invalid job");
        Job storage job = jobs[id];
        require(msg.sender == job.agent, "Agent does not have access to this job");
        require(!job.rejected, "Job already rejected");
        require(!job.completed, "Job already completed");
        job.accepted = false;
        job.rejected = true;
        (bool ok,) = payable(job.renter).call{value: job.amount}("");
        require(ok, "Failed to refund payment to renter");
        emit JobRejected(id);
    }

    function completeJob(uint256 id) public {
        require(id < counter, "Invalid job");
        Job storage job = jobs[id];
        require(msg.sender == job.agent, "Agent does not have access to this job");
        require(job.accepted, "Job not accepted");
        require(!job.rejected, "Job already rejected");
        require(!job.completed, "Job already completed");
        job.completed = true;
        (bool ok,) = payable(msg.sender).call{value: job.amount}("");
        require(ok, "Failed to issue payment to agent");
        emit JobCompleted(id);
    }

    function refundJob(uint256 id) public {
        require(id < counter, "Invalid job");
        Job storage job = jobs[id];
        require(msg.sender == job.renter, "Renter does not have access to this job");
        require(!job.rejected, "Job already rejected");
        require(!job.completed, "Job already completed");
        Agent storage agent = agents[job.agent];
        require(!agent.exists, "Agent still exists");
        job.accepted = false;
        job.rejected = true;
        (bool ok,) = payable(job.renter).call{value: job.amount}("");
        require(ok, "Failed to refund payment to renter");
        emit JobRefunded(id);
    }
}
