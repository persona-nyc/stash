

// a reply is a message that is sent by an agent in response to an action.
interface Reply {
	action: Action,
	agent: Agent,
	md_text: string //markdown type string that gets parsed for further processing by client.
}

// a token amount is a number with a token attached to it. this is an object used for representing money itself.
interface TokenAmount {
	amount: number, //the amount of the token
	token: any, //token class where you can call .toString() and get "USD"
	//basic currency math operators...
	toString(): string,
	isGreater(amount: TokenAmount): boolean,
	isLess(amount: TokenAmount): boolean,
	isEqual(amount: TokenAmount): boolean,
	add(amount: TokenAmount): TokenAmount,
	subtract(amount: TokenAmount): TokenAmount,
	multiply(amount: TokenAmount): TokenAmount,
	divide(amount: TokenAmount): TokenAmount,
}


//use helper functions like amt(10).toSomeTypeOfString() to get "10.00 USD" or "$10.00" or "$" and "10.00" sperately based on use case where amt is constructor for TokenAmount
//amt(10).add(amt(5)).isEqual(amt(15)) == true

// an action is what will always appear in the ledger. it is a record of either a transfer of value or a mutation of the terms of a stash.
interface Action {
	stash: Stash,
	agent: Agent,
	replies: Reply[],
}

// a transaction is a transfer of value from stash with a rule to another stash with a rule. the action must be tested against the rules of both stashes to determine if the action is valid.
interface TransAction extends Action {
	target_stash: Stash,
	amount: TokenAmount,
}

// an alter action is a mutation of the rules of a stash.
interface AlterAction extends Action {
	old_rule: Rule | undefined,
	new_rule: Rule | undefined,
}



// some sort of KYC'able agent that may perform actions.
interface Agent {
	id: string, //some sort of unique text which will be indexed and used for reference in the ledger. this can be a name, email, or some other unique identifier.
	meta: { [key: string]: any }, //any non-essential information about the agent (avatar, bio, whatever)
	stashes: Stash[],
}


// a rule is a function that must be tested against an action to determine if the action is valid within the context of the stash that it is in
interface Rule {
	id: string, //a unique identifier for the rule.
	params: { [key: string]: any }, //any parameters that are needed for the rule to function.
	test(action: TransAction | AlterAction): boolean //the test function is what determines if an action is valid or not.
	plainRender?(): [string, { [key: string]: any }] //this function will return a tuple of a string and an object. the string will be a natural language representation of the rule. the object will be a dictionary of any parameters that are needed to render the rule.
	render?(condition: RuleSetCondition): any //this function will return a react component that will render the rule.
}

//a rule that is tested against a transaction
interface TransActionRule extends Rule {
	test(action: TransAction): boolean
}

//a rule that is tested against a rule alteration
interface AlterActionRule extends Rule {
	test(action: AlterAction): boolean
}

// a stash is a collection of rules and actions that are associated with a particular agent.
interface Stash {
	agent: Agent, // only one initial agent that created this stash and set up the terms of the stash.
	actions: (TransAction | AlterAction)[], // all actions that have been performed on this stash.
	ruleset: RuleSet, // all rule that are currently active on this stash.
	badges: [{
		// badges are a way to track the reputation of an agent. they are awarded automatically through rules or by other agents. badges can be used to test against rules.
		// mutations in the badges array are recorded in the ledger as alter actions. - "agent X" recieved "badge Y" from (alter action)
		agent: Agent,
		id: string,
		meta: { [key: string]: any },
	}],
	cache: { [key: string]: any }, //this contains any aggregate info of all the agents that have interacted with this stash and the amount of value they have transferred to/from this stash. gets recomputed on each action.
}



type RuleSetCondition = {
	rule: Rule,
	if: boolean, //this will be compared against the result of the rule.test() function.
	if_true_then?: RuleSetCondition[]
}

interface RuleSet {
	conditions: RuleSetCondition[]
	test(action: TransAction | AlterAction): boolean
	render(): any //this function will return a react component that will render the ruleset terms in a natural language format.
}



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


// adding rule classes to the rule registry which can either be paired with other classes or used on their own, or nested within other rules.
class TransactionLessThanAmount extends TransActionRule {
	params: {
		amount: TokenAmount,
	}
	test(action: TransAction): boolean {
		if (action.amount.isLess(this.params.amount)) {
			return true;
		}
		return false;
	}

	plainRender(): any {
		return ['transation amount is less than', { token: this.params.amount }]
	}
}


//checks if the stash of the action
class AgentHasStashBadgeRule extends ActionRule {
	params: {
		badge_id: string,
	}
	plainRender(): any {
		return ["member holds", { badge_id: this.params.badge_id }]
	}
	test(action: TransAction | AlterAction): boolean {
		action.stash.badges.forEach((badge) => {
			if (badge.id == this.params.badge_id) {
				if (badge.agent.id == action.agent.id) {
					return true;
				}
			}
		})
		return false;
	}
}


//now we can combine these predefined rules together to create more complex rules using the RuleSet class.



//transaction is okay if 
// action agent has badge "verified" and transaction is less than 100.00 USD
// and
// transaction is less than 100.00 USD
function money(amount: number): TokenAmount {
	return new TokenAmount(amount)
}


//if action agent is missing badge "parent" then limit transaction amount to 100.00 USD
let parent_has_no_limit = new RuleSet([
	{
		check_if: new AgentHasStashBadgeRule({ badge_id: 'parent' }),
		is: false,
		if_true_then: [{
			check_if: new TransactionLessThanAmount({ amount: money(100) }),
			is: true
			if_true_then: TRANSACTION_OKAY
		}]
	}
])

//parent_has_no_limit.toString() will be:
/*
	allow transaction when member has badge {badge_id} is false and transaction is less than {amount} is false

*/




let child_has_less_limit = new RuleSet([
	{
		rule: new AgentHasStashBadgeRule({ badge_id: 'child' }),
		expect: true,
		conditions: [{
			rule: new TransactionLessThanAmount({ amount: money(100) }),
			expect: false
		}]
	}
])


// the resulting limit_non_parent.toTemplateString() will be:
/*
	where member does not hold badge "parent"
		limit transaction amount to {limit.toDefaultString()}

*/



// the resulting limit_parent.toTemplateString() will be:
// on any transaction
//limit to where member holds badge "parent"





//for the above code when you run .toString() this natural language rule template will be generated on client:
//on any transaction
//where member holds badge {badge:"verified"}
//limit transaction amount to {amount:100.00,token:"USD",token_symbol:"$"}



import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: 'my api key', // defaults to process.env["OPENAI_API_KEY"]
});

async function main() {
	const completion = await openai.chat.completions.create({
		messages: [{ role: 'user', content: 'Say this is a test' }],
		model: 'gpt-3.5-turbo',
	});

	console.log(completion.choices);
}

main();