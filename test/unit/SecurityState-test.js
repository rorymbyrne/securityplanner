import { expect } from "chai";

import Effect from "./../../src/js/stores/data/Effect";
import Level from "./../../src/js/stores/data/Level";
import SecurityState from "./../../src/js/stores/data/SecurityState";
import Statement from "./../../src/js/stores/data/Statement";
import Threat from "./../../src/js/stores/data/Threat";
import Tool from "./../../src/js/stores/data/Tool";

import StringUtils from "./../../src/js/vendor/utils/StringUtils";


// Helper functions and data ===================================================

const _or_ = SecurityState.REQUIREMENTS_OPERATOR_OR;
const _and_ = SecurityState.REQUIREMENTS_OPERATOR_AND;

function createThreat(name, deprioritizeInLists = false) {
	return Object.assign(new Threat(),
		{
			id: StringUtils.slugifySafely(name),
			name: name,
			longDescription: `A long (hopefully) description for threat ${name}`,
			shortDescription: `Short description for ${name}`,
			stats: `${name} realy makes you safe`,
			statsSource: `http://www.google.com?q=${name}`,
			statsName: "Some credible source",
			deprioritizeInLists: deprioritizeInLists,
		}
	);
}
function createTool(index, name, threat, requirements) {
	return Object.assign(new Tool(),
		{
			id: StringUtils.slugifySafely(name),
			threat: threat,
			image: `https://dummyimage.com/400x400/fff/000.png&text=${name}`,
			name: name,
			headline: `USE ${name}`,
			label: index % 2 == 0 ? "Cool" : "Hot",
			price: (index + 1) * 10,
			shortDescription: `Short description for ${name}`,
			longDescription: `A long (hopefully) description for tool ${name}`,
			buttons: [ { caption: "BUY or GET", url: `http://www.google.com?q=${name}` }],
			basePoints: 0,
			earlyRecommendationAllowed: true,
			useForIndividuals: index % 2 == 0,
			useForActivistsAndJournalists: index % 3 == 0,
			useForOrganizations: index % 4 == 0,
			reviews: [],
			resources: [],
			requirements: requirements,
		}
	);
}
function createStatement(index, text, level, requirements, selectedEffects, deselectedEffects) {
	return Object.assign(new Statement(),
		{
			id: StringUtils.slugifySafely(text),
			text: text,
			image: `https://dummyimage.com/400x400/fff/000.png&text=${text}`,
			backgroundColor: 0xffffff >> (index * 4),
			level: level.id,
			requirements: requirements,
			isRequired: false,
			selectedEffects: selectedEffects,
			deselectedEffects: deselectedEffects,
		}
	);
}
function createLevel(id, title, recomendationsNeeded, answersRequired) {
	return Object.assign(new Level(),
		{
			id: StringUtils.slugifySafely(title),
			title: title,
			recomendationsNeeded: recomendationsNeeded,
			answersRequired: answersRequired,
		}
	);
}
function createEffects(effect) {
	return [Object.assign(new Effect(),
		{
			tools: effect,
		}
	)];
}

// Normal threats
const threats = [
	createThreat("Threat group 0"),
	createThreat("Threat group 1"),
	createThreat("Threat group 2"),
	createThreat("Threat group 3"),
];

// Normal tools
let tools = [
	createTool(0, "Tool 0", threats[0], []),
	createTool(1, "Tool 1", threats[0], []),
	createTool(2, "Tool 2", threats[1], []),
	createTool(3, "Tool 3", threats[1], []),
	createTool(4, "Tool 4", threats[2], []),
];
tools[3].earlyRecommendationAllowed = false;

// Normal levels
const levels = [
	createLevel("a", "First round (A)",  0, 0),
	createLevel("b", "Second round (B)", 0, 0),
	createLevel("c", "Third round (C)",  0, 0),
];

// Normal statements
let statements = [
	createStatement(0, "Statement 0", levels[0], [], createEffects({ [tools[0].id]: 1 }), createEffects({ [tools[1].id]: -1 })),
	createStatement(1, "Statement 1", levels[0], [], createEffects({ [tools[0].id]: 1, [tools[1].id]: 1, [tools[2].id]: 1, [tools[3].id]: 1, [tools[4].id]: 1 }), []),
	createStatement(2, "Statement 2", levels[1], [], createEffects({ [tools[1].id]: 2 }), []),
	createStatement(3, "Statement 3", levels[1], [], createEffects({ [tools[2].id]: 2 }), []),
	createStatement(4, "Statement 4", levels[2], [], createEffects({ [tools[3].id]: 17 }), []),
	createStatement(5, "Statement 5", levels[2], [], createEffects({ [tools[4].id]: -2, [tools[0].id]: -0.5, [tools[2].id]: -1 }), []),
];

// Statements with requirements
statements = statements.concat([
	createStatement(6, "Statement 6", levels[2], [statements[0].id],                                     createEffects({ [tools[0].id]: 1 }), []),
	createStatement(7, "Statement 7", levels[2], [statements[0].id, _and_, statements[1].id],            createEffects({ [tools[1].id]: 10 }), []),
	createStatement(8, "Statement 8", levels[2], ["!" + statements[0].id],                               createEffects({ [tools[3].id]: 1 }), []),
	createStatement(9, "Statement 9", levels[2], ["!" + statements[0].id, _or_, "!" + statements[1].id], createEffects({ [tools[3].id]: 1 }), []),
]);

// Tools with requirements, and statements to test
tools = tools.concat([
	createTool(5, "Tool 5", threats[3], [statements[0].id]),
	createTool(6, "Tool 6", threats[3], [statements[0].id, _or_, statements[1].id]),
	createTool(7, "Tool 7", threats[3], [statements[0].id, _and_, statements[1].id]),
]);
statements = statements.concat([
	createStatement(10, "Statement 10", levels[2], [], createEffects({ [tools[5].id]: 1 }), []),
	createStatement(11, "Statement 11", levels[2], [], createEffects({ [tools[6].id]: 1 }), []),
	createStatement(12, "Statement 12", levels[2], [], createEffects({ [tools[7].id]: 1 }), []),
]);

function toggleStatement(statement) {
	securityState.toggleStatementSelected(statement.id);
	securityState.recalculateRecommendations();
}

function setStatementSelected(statement, value) {
	securityState.setStatementSelected(statement.id, value);
}

function benchmark(t) {
	t.timeout(10000);
	let i = NaN;
	const testTimes = 10000;

	console.time("TEST");
	for (i = 0; i < testTimes; i++) {
		securityState.deselectAllStatements();
		securityState.recalculateRecommendations();
		toggleStatement(statements[10]);
		toggleStatement(statements[0]);
		toggleStatement(statements[10]);
		expect(securityState.tools[5].recommendationPoints).to.equal(1);
		toggleStatement(statements[0]);
		toggleStatement(statements[11]);
		toggleStatement(statements[12]);
		expect(securityState.tools[6].recommendationPoints).to.equal(0);
		expect(securityState.tools[7].recommendationPoints).to.equal(0);
		toggleStatement(statements[0]);
		toggleStatement(statements[11]);
		toggleStatement(statements[12]);
		expect(securityState.tools[6].recommendationPoints).to.equal(1);
		expect(securityState.tools[7].recommendationPoints).to.equal(0);
		toggleStatement(statements[1]);
		toggleStatement(statements[11]);
		toggleStatement(statements[12]);
		expect(securityState.tools[6].recommendationPoints).to.equal(1);
		expect(securityState.tools[7].recommendationPoints).to.equal(1);
		toggleStatement(statements[1]);
		toggleStatement(statements[11]);
		toggleStatement(statements[12]);
		expect(securityState.tools[6].recommendationPoints).to.equal(1);
		expect(securityState.tools[7].recommendationPoints).to.equal(0);
		toggleStatement(statements[0]);
		toggleStatement(statements[11]);
		toggleStatement(statements[12]);
	}
	console.timeEnd("TEST");
}

const securityState = new SecurityState(statements, tools, threats, levels);


// Actual tests ================================================================

describe("SecurityState", function() {
	beforeEach((done) => {
		securityState.deselectAllStatements();
		securityState.recalculateRecommendations();
		securityState.deprioritizeMarkedRecommendedThreats();
		done();
	});

	it("should toggle statement selections", function() {
		expect(securityState.isAnyStatementSelected()).to.equal(false);
		toggleStatement(statements[0]);
		expect(securityState.isAnyStatementSelected()).to.equal(true);
		toggleStatement(statements[0]);
		expect(securityState.isAnyStatementSelected()).to.equal(false);
		setStatementSelected(statements[0], true);
		expect(securityState.isAnyStatementSelected()).to.equal(true);
		setStatementSelected(statements[0], false);
		expect(securityState.isAnyStatementSelected()).to.equal(false);
	});

	it("should give points to one tool when selected", function() {
		toggleStatement(statements[0]);
		expect(securityState.recommendedTools.length).to.equal(1);
		expect(securityState.recommendedTools[0]).to.equal(tools[0]);
		expect(securityState.recommendedTools[0].recommendationPoints).to.equal(1);
		expect(securityState.topRecommendedTool).to.equal(tools[0]);
	});

	it("should give negative points to one tool when deselected", function() {
		expect(tools[1].recommendationPoints).to.equal(-1);
		toggleStatement(statements[0]);
		expect(tools[1].recommendationPoints).to.equal(0);
	});

	it("should give points to several tools when selected", function() {
		toggleStatement(statements[1]);
		expect(securityState.recommendedTools.length).to.equal(4);
		expect(securityState.tools[0].recommendationPoints).to.equal(1);
		expect(securityState.tools[1].recommendationPoints).to.equal(0);
		expect(securityState.tools[2].recommendationPoints).to.equal(1);
		expect(securityState.tools[3].recommendationPoints).to.equal(1);
		expect(securityState.tools[4].recommendationPoints).to.equal(1);
		expect(securityState.topRecommendedTool).to.equal(tools[2]);
	});

	it("should add and subtract points when several statements are selected", function() {
		toggleStatement(statements[0]);
		toggleStatement(statements[1]);
		toggleStatement(statements[2]);
		toggleStatement(statements[3]);
		toggleStatement(statements[4]);
		toggleStatement(statements[5]);
		expect(securityState.tools[0].recommendationPoints).to.equal(1.5); // Threat 0
		expect(securityState.tools[1].recommendationPoints).to.equal(3); // Threat 0
		expect(securityState.tools[2].recommendationPoints).to.equal(2); // Threat 1
		expect(securityState.tools[3].recommendationPoints).to.equal(18); // Threat 1
		expect(securityState.tools[4].recommendationPoints).to.equal(-1); // Threat 2
		expect(securityState.recommendedTools.length).to.equal(4);
		expect(securityState.recommendedTools[0]).to.equal(tools[3]); // Threat 1
		expect(securityState.recommendedTools[1]).to.equal(tools[1]); // Threat 0
		expect(securityState.recommendedTools[2]).to.equal(tools[2]); // Threat 1
		expect(securityState.recommendedTools[3]).to.equal(tools[0]); // Threat 0
		expect(securityState.recommendedThreats.length).to.equal(2);
		expect(securityState.recommendedThreats[0]).to.equal(threats[1]);
		expect(securityState.recommendedThreats[1]).to.equal(threats[0]);
		expect(securityState.topRecommendedTool).to.equal(tools[2]);
	});

	it("changing statements should reset statements from subsequent levels", function() {
		expect(securityState.isStatementSelected(statements[4].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[5].id)).to.equal(false);
		toggleStatement(statements[4]);
		toggleStatement(statements[5]);
		expect(securityState.isStatementSelected(statements[2].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[4].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[5].id)).to.equal(true);
		toggleStatement(statements[2]);
		expect(securityState.isStatementSelected(statements[0].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[2].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[4].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[5].id)).to.equal(false);
		toggleStatement(statements[0]);
		expect(securityState.isStatementSelected(statements[0].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[2].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[4].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[5].id)).to.equal(false);
	});

	it("should match statement requirements", function() {
		expect(securityState.checkStatementRequirements([ "!" + statements[0].id ])).to.equal(true);
		toggleStatement(statements[0]);
		expect(securityState.checkStatementRequirements([ statements[0].id ])).to.equal(true);
		expect(securityState.checkStatementRequirements([ "!" + statements[0].id ])).to.equal(false);
		expect(securityState.checkStatementRequirements([ statements[1].id ])).to.equal(false);
		expect(securityState.checkStatementRequirements([ statements[0].id, _or_, statements[1].id ])).to.equal(true);
		expect(securityState.checkStatementRequirements([ "!" + statements[0].id, _or_, statements[1].id ])).to.equal(false);
		expect(securityState.checkStatementRequirements([ statements[0].id, _and_, statements[1].id ])).to.equal(false);
		expect(securityState.checkStatementRequirements([[ statements[0].id, _or_, statements[1].id ], _or_, statements[2].id])).to.equal(true);
		expect(securityState.checkStatementRequirements([[ statements[0].id, _or_, statements[1].id ], _and_, statements[2].id])).to.equal(false);
		toggleStatement(statements[1]);
		expect(securityState.checkStatementRequirements([ statements[0].id, _and_, statements[1].id ])).to.equal(true);
		expect(securityState.checkStatementRequirements([[ statements[0].id, _and_, statements[2].id ], _or_, statements[1].id])).to.equal(true);
		expect(securityState.checkStatementRequirements([ "!" + statements[0].id, _or_, statements[1].id ])).to.equal(true);
		toggleStatement(statements[0]);
		expect(securityState.checkStatementRequirements([ statements[0].id ])).to.equal(false);
		expect(securityState.checkStatementRequirements([ statements[1].id ])).to.equal(true);
	});

	it("should match statement visibility based on requirements", function() {
		expect(securityState.isStatementVisible(statements[6].id)).to.equal(false);
		expect(securityState.isStatementVisible(statements[7].id)).to.equal(false);
		expect(securityState.isStatementVisible(statements[8].id)).to.equal(true);
		expect(securityState.isStatementVisible(statements[9].id)).to.equal(true);
		toggleStatement(statements[0]);
		expect(securityState.isStatementVisible(statements[6].id)).to.equal(true);
		expect(securityState.isStatementVisible(statements[7].id)).to.equal(false);
		expect(securityState.isStatementVisible(statements[8].id)).to.equal(false);
		expect(securityState.isStatementVisible(statements[9].id)).to.equal(true);
		toggleStatement(statements[1]);
		expect(securityState.isStatementVisible(statements[6].id)).to.equal(true);
		expect(securityState.isStatementVisible(statements[7].id)).to.equal(true);
		expect(securityState.isStatementVisible(statements[8].id)).to.equal(false);
		expect(securityState.isStatementVisible(statements[9].id)).to.equal(false);
		toggleStatement(statements[0]);
		expect(securityState.isStatementVisible(statements[6].id)).to.equal(false);
		expect(securityState.isStatementVisible(statements[7].id)).to.equal(false);
		expect(securityState.isStatementVisible(statements[8].id)).to.equal(true);
		expect(securityState.isStatementVisible(statements[9].id)).to.equal(true);
	});

	it("should match statement points based on requirements", function() {
		// Should be selectable but not count for points
		toggleStatement(statements[6]);
		toggleStatement(statements[7]);
		toggleStatement(statements[8]);
		toggleStatement(statements[9]);
		expect(securityState.isStatementSelected(statements[6].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[7].id)).to.equal(true);
		expect(securityState.tools[0].recommendationPoints).to.equal(0);
		expect(securityState.tools[1].recommendationPoints).to.equal(-1);
		expect(securityState.tools[3].recommendationPoints).to.equal(2);

		// Selecting a statement from a previous level de-selects our test statements, so we need to re-select
		toggleStatement(statements[0]);
		expect(securityState.isStatementSelected(statements[6].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[7].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[8].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[9].id)).to.equal(false);
		toggleStatement(statements[6]);
		toggleStatement(statements[7]);
		toggleStatement(statements[8]);
		toggleStatement(statements[9]);
		expect(securityState.isStatementSelected(statements[6].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[7].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[8].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[9].id)).to.equal(true);
		expect(securityState.tools[0].recommendationPoints).to.equal(2);
		expect(securityState.tools[1].recommendationPoints).to.equal(0);
		expect(securityState.tools[3].recommendationPoints).to.equal(1);

		toggleStatement(statements[1]);
		expect(securityState.isStatementSelected(statements[6].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[7].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[8].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[9].id)).to.equal(false);
		toggleStatement(statements[6]);
		toggleStatement(statements[7]);
		toggleStatement(statements[8]);
		toggleStatement(statements[9]);
		expect(securityState.isStatementSelected(statements[6].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[7].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[8].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[9].id)).to.equal(true);
		expect(securityState.tools[0].recommendationPoints).to.equal(3);
		expect(securityState.tools[1].recommendationPoints).to.equal(11);
		expect(securityState.tools[3].recommendationPoints).to.equal(1);
	});

	it("should limit tools based on additional statement requirements", function() {
		// Statement 0 adds no points to tool 5, but is requirement
		// Statement 10 does add points, and has no requirements, but the tool should
		// only be allowed if statement 0 is selected
		toggleStatement(statements[10]);
		expect(securityState.isStatementVisible(statements[10].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[10].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[0].id)).to.equal(false);
		expect(securityState.tools[5].recommendationPoints).to.equal(0);
		// Now that statement 0 is selected, the points will apply
		toggleStatement(statements[0]);
		toggleStatement(statements[10]);
		expect(securityState.tools[5].recommendationPoints).to.equal(1);

		// Turn off 0
		toggleStatement(statements[0]);
		toggleStatement(statements[11]);
		toggleStatement(statements[12]);
		expect(securityState.tools[6].recommendationPoints).to.equal(0);
		expect(securityState.tools[7].recommendationPoints).to.equal(0);

		// Turn on 0 again
		toggleStatement(statements[0]);
		toggleStatement(statements[11]);
		toggleStatement(statements[12]);
		expect(securityState.tools[6].recommendationPoints).to.equal(1);
		expect(securityState.tools[7].recommendationPoints).to.equal(0);

		// Turn on 1
		toggleStatement(statements[1]);
		toggleStatement(statements[11]);
		toggleStatement(statements[12]);
		expect(securityState.tools[6].recommendationPoints).to.equal(1);
		expect(securityState.tools[7].recommendationPoints).to.equal(1);

		// Turn off 1
		toggleStatement(statements[1]);
		toggleStatement(statements[11]);
		toggleStatement(statements[12]);
		expect(securityState.tools[6].recommendationPoints).to.equal(1);
		expect(securityState.tools[7].recommendationPoints).to.equal(0);

		// Turn off 0
		toggleStatement(statements[0]);
		toggleStatement(statements[11]);
		toggleStatement(statements[12]);
		expect(securityState.tools[6].recommendationPoints).to.equal(0);
		expect(securityState.tools[7].recommendationPoints).to.equal(0);
	});

	it("should save the state correctly", function() {
		// Start
		expect(securityState.isStatementSelected(statements[0].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[1].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[2].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[3].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[4].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[5].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[6].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[7].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[10].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[12].id)).to.equal(false);
		expect(securityState.recommendedTools.length).to.equal(0);
		expect(securityState.topRecommendedTool).to.equal(undefined);

		// Set
		toggleStatement(statements[0]);
		toggleStatement(statements[1]);
		toggleStatement(statements[2]);
		toggleStatement(statements[3]);
		toggleStatement(statements[4]);
		toggleStatement(statements[5]);
		toggleStatement(statements[6]);
		toggleStatement(statements[7]);
		toggleStatement(statements[10]);
		toggleStatement(statements[12]);

		expect(securityState.isStatementSelected(statements[0].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[1].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[2].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[3].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[4].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[5].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[6].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[7].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[10].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[12].id)).to.equal(true);
		expect(securityState.recommendedTools.length).to.equal(6);
		expect(securityState.topRecommendedTool).to.equal(tools[2]);

		// Save
		const savedStateHash = securityState.saveState();
		expect(savedStateHash).to.equal("soX-DUuqaAFWwscCTmqS");

		// Reset
		securityState.deselectAllStatements();
		securityState.recalculateRecommendations();

		expect(securityState.isStatementSelected(statements[0].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[1].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[2].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[3].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[4].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[5].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[6].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[7].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[10].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[12].id)).to.equal(false);
		expect(securityState.recommendedTools.length).to.equal(0);
		expect(securityState.topRecommendedTool).to.equal(undefined);

		// Reload
		securityState.loadState(savedStateHash);

		expect(securityState.isStatementSelected(statements[0].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[1].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[2].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[3].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[4].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[5].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[6].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[7].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[10].id)).to.equal(true);
		expect(securityState.isStatementSelected(statements[12].id)).to.equal(true);
		expect(securityState.recommendedTools.length).to.equal(6);
		expect(securityState.topRecommendedTool).to.equal(tools[2]);
	});

	it("should not have a deprioritized threat listed first", function() {
		// Start
		expect(securityState.threats[0].deprioritizeInLists).to.equal(false);
		expect(securityState.threats[1].deprioritizeInLists).to.equal(false);
		expect(securityState.threats[2].deprioritizeInLists).to.equal(false);
		expect(securityState.threats[3].deprioritizeInLists).to.equal(false);
		expect(securityState.isStatementSelected(statements[0].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[1].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[2].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[3].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[4].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[5].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[6].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[7].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[10].id)).to.equal(false);
		expect(securityState.isStatementSelected(statements[12].id)).to.equal(false);
		expect(securityState.recommendedTools.length).to.equal(0);
		expect(securityState.topRecommendedTool).to.equal(undefined);

		// Set
		toggleStatement(statements[0]);
		toggleStatement(statements[1]);
		toggleStatement(statements[2]);
		toggleStatement(statements[3]);
		toggleStatement(statements[4]);
		toggleStatement(statements[5]);
		toggleStatement(statements[6]);
		toggleStatement(statements[7]);
		toggleStatement(statements[10]);
		toggleStatement(statements[12]);

		securityState.recalculateRecommendations();
		securityState.deprioritizeMarkedRecommendedThreats();

		// By default all threats should have deprioritizeInLists marked as false
		const initialTopThreat = securityState.recommendedThreats[0];
		expect(initialTopThreat.deprioritizeInLists).to.equal(false);
		
		// Mark deprioritizeInLists as true for top-ranked threat
		initialTopThreat.deprioritizeInLists = true;
		// Top threat should be unchanged
		expect(securityState.recommendedThreats[0].deprioritizeInLists).to.equal(true);
		expect(securityState.recommendedThreats[0]).to.equal(initialTopThreat);

		// Should force top-ranked threat down one level
		securityState.recalculateRecommendations();
		securityState.deprioritizeMarkedRecommendedThreats();
		expect(securityState.recommendedThreats[0].deprioritizeInLists).to.equal(false);		
		// Top threat should be changed
		expect(securityState.recommendedThreats[0]).to.not.equal(initialTopThreat);
		expect(securityState.recommendedThreats[1]).to.equal(initialTopThreat);
		
		// Reset state
		securityState.threats[0].deprioritizeInLists = false;
		securityState.threats[1].deprioritizeInLists = false;
		securityState.threats[2].deprioritizeInLists = false;
		securityState.threats[3].deprioritizeInLists = false;
	});
});
