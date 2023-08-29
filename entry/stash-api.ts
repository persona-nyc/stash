/* INITIAL IMPLEMENTATION */
//the ruleset is a collection of rules that are tested against an action. if all of the rules pass, then the action is valid.
//the ruleset will be the entry point used to test against actions and predict which actions can or cannot be performed for a given agent.
class RuleSet {
	conditions: RuleSetCondition[]
	constructor(conditions: RuleSetCondition[]) {
		this.conditions = conditions
	}
	testCondition(action, condition) {
		if (condition.expect !== condition.rule.test(action)) {
			return false
		}
		if (condition.conditions?.length) {
			for (let sub_condition of condition.conditions) {
				if (this.testCondition(action, sub_condition) === false) {
					return false
				}
			}
		}
		return true
	}
	test(action: TransAction | AlterAction) {
		for (let condition of this.conditions) {
			if (this.testCondition(action, condition) !== condition.expect) {
				return false
			}
		}
		return true
	}
	render() {

	}
}





// trans action base class implementation
class TransActionRule implements TransActionRule {
	id: string;
	params: { [key: string]: any };
	constructor(params: { [key: string]: any }) {
		this.params = params
	}
	test(action: TransAction): boolean {
		return false
	}
}

// rule base class implementation.
class AlterActionRule implements AlterActionRule {
	id: string;
	params: { [key: string]: any };
	constructor(params: { [key: string]: any }) {
		this.params = params
	}
	test(action: AlterAction): boolean {
		return false
	}
}

// action base class implementation.
class ActionRule implements ActionRule {
	id: string;
	params: { [key: string]: any };
	constructor(params: { [key: string]: any }) {
		this.params = params
	}
	test(action: TransAction | AlterAction): boolean {
		return false
	}
}