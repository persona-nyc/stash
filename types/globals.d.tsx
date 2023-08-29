

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



