/**
 * # Everhour API
 *
 * **The Everhour API is currently in BETA**, which means that some API calls can be slightly adjusted in near future.
 * Meanwhile, we do our best to push any BC changes in separate API versions and protect your integrations from unexpected crashes.
 * For any suggestions, feedback and issues please send a message to chat inside your Everhour account or email us at ask@everhour.com.
 *
 * ## Getting Started
 *
 * Everhour API is a RESTful interface, providing programmatic access to much of the data in the system.
 * It provides predictable URLs to access resources, and uses built-in HTTP features to receive commands and return responses.
 * This makes it easy to communicate with from a wide variety of environments, from command-line utilities to gadgets to the browser URL bar itself.
 * The API accepts only JSON content in requests and returns JSON content in all of its responses, including errors.
 * Only the UTF-8 character encoding is supported for both requests and responses.
 *
 * ## Authentication
 *
 * Currently, we provide only a plain authorization by an API key.
 * You can find an API key in [your profile](https://app.everhour.com/#/account/profile) at the bottom of the page.
 * All your requests should include **X-Api-Key** header with valid API key.  For example:  `X-Api-Key: abcd-efgh-1234567-7890ab-cdefgh12`
 *
 * ## Versioning
 *
 * Optionally, you can use specific API version with **X-Accept-Version** request header.
 * We will stick you with the most recent version (1.2) if there are no such header in the request.
 * For example:  `X-Accept-Version: 1.2`
 *
 * ## Rate Limiting
 *
 * The limit is currently around 20 requests per 10 seconds per API key, but this is not guaranteed:
 * it may vary with server load, and we may change it in the future. You will receive a **429** HTTP response if you exceed the rate limit.
 * **Retry-After** response header will specify the number of seconds after the user can make another request.
 * Please contact us first, if you need perform a batch of API requests.
 * Maybe we can provide you a more convenient way to retrieve the data.
 *
 * @example
 * const client = new EverhourApiClient(apiKey);
 * const users = await getAllUsers(client);
 */
export class EverhourApiClient {
  private readonly props = Object.freeze({
    basePath: "https://api.everhour.com",
    version: "1.2",
    extractParams: /(?<=\{)[^}]+(?=})/g,
  });

  private readonly headers = Object.seal({
    "Content-Type": "application/json",
    "X-Api-Key": "",
    "X-Accept-Version": this.props.version,
  });

  constructor(apiKey: NonNullable<string>) {
    this.headers["X-Api-Key"] = apiKey;
    Object.freeze(this.headers);
  }

  /**
   * Creates an API URL for the given path and parameters
   *
   * @param path with parameters like `'/users/{userId}/timecard'`
   * @param pathParams corresponding parameters to be inserted in the path like `{ userId: 4096 }`
   * @param searchParams optional search parameters like `{ dateGte: '2020-12-31' }`
   * @returns URL
   * @throws {RequiredError}
   */
  public createUrl(
    path: string,
    pathParams: Record<string, number | string> = {},
    searchParams: Record<string, boolean | number | string | undefined> = {},
  ): URL {
    const requiredParams = path.match(this.props.extractParams);
    if (requiredParams !== null) {
      for (const param of requiredParams) {
        if (
          typeof pathParams[param] !== "string" &&
          typeof pathParams[param] !== "number"
        ) {
          throw new RequiredError(
            param,
            `Required parameter ${param} was undefined or had the wrong type: ${typeof pathParams[
              param
            ]}.`,
          );
        }
      }
    }

    Object.entries(pathParams).forEach(([param, value]) => {
      path = path.replace(`{${param}}`, encodeURIComponent(value));
    });
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([param, value]) => {
      if (value !== undefined) {
        params.append(param, encodeURIComponent(value));
      }
    });
    if (params.size > 0) {
      path += "?" + params.toString();
    }
    return new URL(path, this.props.basePath);
  }

  /**
   * Make an API request an return its results
   *
   * @param method HTTP method
   * @param url URI with params
   * @param payload optional payload
   */
  public async apiRequest<T, R>(
    method: "DELETE",
    url: URL,
    payload?: R,
  ): Promise<T>;
  async apiRequest<T>(method: "GET", url: URL): Promise<T>;
  async apiRequest<T, R>(
    method: "POST" | "PUT",
    url: URL,
    payload?: R,
  ): Promise<T>;
  async apiRequest<T, R>(
    method: "DELETE" | "GET" | "POST" | "PUT",
    url: URL,
    payload?: R | undefined,
  ): Promise<T> {
    const options: RequestInit = { method, headers: this.headers };
    if (payload !== undefined) {
      options.body = JSON.stringify(payload);
    }

    return await fetch(url, options).then(async (response) => {
      if (response.status >= 200 && response.status < 300) {
        return (await response.json()) as T;
      } else {
        const text = await response.text();
        throw new Error(`Status: ${response.status}, Text: '${text}'`);
      }
    });
  }
}

export type WebhookEventType =
  | "api:project:created"
  | "api:project:updated"
  | "api:project:removed"
  | "api:task:created"
  | "api:task:updated"
  | "api:task:removed"
  | "api:timer:started"
  | "api:timer:stopped"
  | "api:time:updated"
  | "api:section:created"
  | "api:section:updated"
  | "api:section:removed"
  | "api:client:created"
  | "api:client:updated"
  | "api:estimate:updated";

/**
 * this class is used to create custom error objects that indicate a required field
 * is missing or invalid, and can be used to provide more context about the error.
 */
export class RequiredError extends Error {
  override name = "RequiredError";
  /**
   * Create a RequiredError instance.
   * @param field The field that was not provided
   * @param msg Optional message to be displayed
   */
  constructor(
    public field: string,
    msg?: string,
  ) {
    super(msg);
  }
}

export interface Assignment {
  /** Number of workdays */
  days?: number;
  endDate?: string;
  id?: string;
  project?: string;
  startDate?: string;
  /** Scheduled time in seconds */
  time?: string;
  type?: AssignmentType;
  user?: string;
}

export type AssignmentType = "project" | "time-off";

export interface AssignmentRequest {
  endDate?: string;
  forceOverride?: boolean;
  project?: string;
  startDate?: string;
  /** Scheduled time in seconds */
  time?: string;
  type?: AssignmentType;
  user?: string;
}

export interface AttachmentDetails {
  id?: number;
  name?: string;
  token?: string;
}

export interface AttachmentRequest {
  /** Base64 file content. Only jpg, png and pdf supported */
  content?: string;
  name?: string;
}

export interface WebhookRequest {
  /** List of events you want to receive */
  events: WebhookEventType[];
  /** You can receive events only for specific project */
  project?: string;
  targetUrl: string;
}

export interface TimecardActionRequest {
  /** Current user date, if not specified we will rely on user profile timezone. */
  userDate?: string;
}

export interface TimecardRequest {
  /** Breaks duration in seconds */
  breakTime?: number;
  /** Clock in time in user timezone */
  clockIn?: string;
  /** Clock out time in user timezone */
  clockOut?: string;
}

export interface Client {
  /** Client Budget */
  budget?: Budget;
  businessDetails?: string;
  id: number;
  name: string;
  projects: string[];
}

export interface Budget {
  /** Start budget from (available only for non-recurrent budgets) */
  appliedFrom?: string;
  /** Budget value in cents (for money) or seconds (for time) */
  budget: number;
  /** Disallow overbudget */
  disallowOverbudget?: boolean;
  /** Exclude expenses */
  excludeExpenses?: boolean;
  /** Exclude non-billable time */
  excludeUnbillableTime?: boolean;
  /** Budget periodicity (overall, monthly, weekly, daily) */
  period: PeriodType;
  /** [readonly] Current budget usage in cents (for money) or seconds (for time) */
  progress?: number;
  /** Email admins when threshold reached. Threshold is percentage: 1 - 100. */
  threshold?: number;
  /** Budget Type */
  type: BudgetType;
}

export type BudgetRequest = Omit<Budget, "progress">;

export interface ClientRequest {
  businessDetails?: string;
  name: string;
  projects?: string[];
}

export interface ClientsDashboardItem {
  /** Billable amount contains billable task time and billable expenses */
  billableAmount?: number;
  /** Billable amount only for expenses */
  billableAmountExpenses?: number;
  /** Billable amount only for task time */
  billableAmountTime?: number;
  /** Billable expenses total. This value contains all billable expenses for the selected period unlike billableAmountTime which can ignore billable expenses for fixed fee projects. */
  billableExpenses?: number;
  /** Billable task time total */
  billableTime?: number;
  /** Client ID */
  clientId?: number;
  /** Client name */
  clientName?: string;
  /** Total costs contains labor costs for task time plus cost expenses */
  costs?: number;
  /** Costs of expenses */
  costsExpenses?: number;
  /** Costs of task time */
  costsTime?: number;
  /** Total expenses amount contains all expenses types */
  expenses?: number;
  /** Non-billable task time */
  nonBillableTime?: number;
  /** Profit is billable amount minus costs */
  profit?: number;
  /** Costs for all time ignoring date filter. Used to calculate profit for fixed fee projects. */
  profitCosts?: number;
  /** Separate expenses total */
  separateExpenses?: number;
  /** Time total */
  time?: number;
  /** How match task time was recorded via timer in % */
  timerTimePc?: number;
  /** Univoiced amount */
  uninvoicedAmount?: number;
}

export interface CommonMetrics {
  /** Billable amount contains billable task time and billable expenses */
  billableAmount?: number;
  /** Billable amount only for expenses */
  billableAmountExpenses?: number;
  /** Billable amount only for task time */
  billableAmountTime?: number;
  /** Billable expenses total. This value contains all billable expenses for the selected period unlike billableAmountTime which can ignore billable expenses for fixed fee projects. */
  billableExpenses?: number;
  /** Billable task time total */
  billableTime?: number;
  /** Total costs contains labor costs for task time and time off plus cost expenses */
  costs?: number;
  /** Costs of expenses */
  costsExpenses?: number;
  /** Costs of task time */
  costsTime?: number;
  /** Costs of time off */
  costsTimeOff?: number;
  /** Total expenses amount contains all expenses types */
  expenses?: number;
  /** Non-billable time total (non-billable task time and time off) */
  nonBillableTime?: number;
  /** Profit is billable amount minus costs */
  profit?: number;
  /** Costs for all time ignoring date filter. Used to calculate profit for fixed fee projects. */
  profitCosts?: number;
  /** Separate expenses total */
  separateExpenses?: number;
  /** Time total (task time and time off) */
  time?: number;
  /** Time off total in days */
  timeOffDays?: number;
  /** Time off total in seconds */
  timeOffTime?: number;
  /** How match task time was recorded via timer in % */
  timerTimePc?: number;
  /** Univoiced amount */
  uninvoicedAmount?: number;
}

export interface EstimateExportObject {
  estimate?: TaskEstimate;
  project?: EstimateExportObjectProject;
  task?: EstimateExportObjectTask;
  time?: TaskTime;
}

/**
 * Will appear only if 'project' passed to `fields` parameter
 */
export interface EstimateExportObjectProject {
  id: string;
  name: string;
  workspace?: string;
}

/**
 * Will appear only if 'task' passed to `fields` parameter
 */
export interface EstimateExportObjectTask {
  dueAt?: string;
  id: string;
  iteration?: string;
  name: string;
  /** Task number */
  number?: number;
  status?: string;
  type?: string;
}

export interface Expense {
  amount?: number;
  attachments?: AttachmentDetails[];
  billable?: boolean;
  category?: number;
  /** 04-04 (string) */
  date?: string;
  details?: string;
  id: number;
  project?: string;
  quantity?: number;
  user?: number;
}

export interface ExpenseCategory {
  color?: string;
  id?: number;
  name?: string;
  unitBased?: boolean;
  unitName?: string;
  unitPrice?: number;
}

export interface ExpenseCategoryDeleteRequest {
  removeExpenses?: boolean;
  targetCategory?: number;
}

export type ExpenseCategoryRequest = Omit<ExpenseCategory, "id">;

export type ExpenseRequest =
  & Omit<Expense, "id">
  & Required<Pick<Expense, "category">>;

/**
 * @type InvoiceStatusType
 */
export type InvoiceStatusType = "draft" | "sent" | "paid";

/**
 * Client
 */
export interface InvoiceClient {
  budget?: Budget;
  businessDetails?: string;
  id: number;
  name: string;
  projects: string[];
}

export type UserRoleType = "admin" | "supervisor" | "member";
export type UserStatusType = "active" | "invited" | "pending" | "removed";

export interface Invoice {
  /** Client */
  client: Client;
  createdAt: string;
  createdBy: User;
  dateFrom?: string;
  dateTill?: string;
  discount?: RateAdjustment;
  dueDate?: string;
  expenseMask?: string;
  /** Invoice ID */
  id: number;
  includeExpenses?: boolean;
  includeTime?: boolean;
  invoiceItems?: InvoiceRequestItem[];
  issueDate?: string;
  limitDateFrom?: string;
  limitDateTill?: string;
  /** List amount in cents (without discount and taxes) */
  listAmount?: number;
  /** Net amount in cents (without taxes but with discount applied) */
  netAmount?: number;
  projects?: string[];
  publicId?: string;
  status: InvoiceStatusType;
  tax?: RateAdjustment;
  timeMask?: string;
  /** Total invoice amount in cents (with discount and taxes applied) */
  totalAmount?: number;
  /** Total invoice time in seconds */
  totalTime?: number;
  valid?: string;
}

export interface InvoiceCreateRequest {
  discount?: RateAdjustment;
  includeExpenses?: boolean;
  includeTime?: boolean;
  limitDateFrom?: string;
  limitDateTill?: string;
  projects?: string[];
  tax?: RateAdjustment;
}

export interface RateAdjustment {
  amount?: number;
  rate?: number;
}

export interface InvoiceItem {
  /** Time in seconds */
  billedTime?: number;
  createdAt?: string;
  custom?: boolean;
  id?: number;
  /** Amount in cents */
  listAmount?: number;
  name?: string;
  /** Amount in cents */
  netAmount?: number;
  position?: number;
  taxable?: number;
  totalAmount?: number;
}

export interface InvoiceRequestItem {
  /** Time in seconds */
  billedTime?: number;
  id?: number;
  /** Amount in cents */
  listAmount?: number;
  name?: string;
  position?: number;
  taxable?: boolean;
}

export interface InvoiceRefreshRequest {
  expenseMask?: string;
  includeExpenses?: boolean;
  includeTime?: boolean;
  limitDateFrom?: string;
  limitDateTill?: string;
  projects?: string[];
  timeMask?: string;
}

export interface InvoiceUpdateRequest {
  discount?: RateAdjustment;
  dueDate?: string;
  invoiceItems?: InvoiceRequestItem[];
  issueDate?: string;
  publicId?: string;
  publicNotes?: string;
  reference?: string;
  tax?: RateAdjustment;
}

export interface Project {
  /** Billing type */
  billing?: ProjectBilling;
  /** Budget */
  budget?: Budget;
  /** Client ID */
  client?: number;
  favorite?: boolean;
  id: string;
  name: string;
  /** Rates configuration for billing or budget progress */
  rate?: BillingRate;
  /** Project Type */
  type?: ProjectType;
  /** List of assigned user IDs */
  users?: number[];
  workspaceId?: string;
  workspaceName?: string;
}

export type ProjectType = "board" | "list";

export type ProjectBillingBudgetRequest = Pick<
  Project,
  "billing" | "budget" | "rate"
>;

export interface ProjectBilling {
  /** Project fixed fee in cents (e.g. 10000 means $100.00). Available only for `fixed_fee` type. */
  fee?: number;
  /** Project Type */
  type: BillingType;
}

export type BillingType = "non_billable" | "hourly" | "fixed_fee";

export type PeriodType = "general" | "monthly" | "weekly" | "daily";

export type BudgetType = "money" | "time";

export interface BillingRate {
  /** Flat-rate in cents (e.g. 10000 means $100.00). Available only for `project_rate` type. */
  rate?: number;
  /** Project Type */
  type: RateType;
  userCostOverrides?: AmountOverrides;
  userRateOverrides?: AmountOverrides;
}

export type RateType = "project_rate" | "user_rate" | "user_cost";

/**
 * Override for user rates or costs.
 * userId as key, rate (in cents) as value
 */
export interface AmountOverrides {
  [userId: string]: number;
}

export interface ProjectRequest {
  name: string;
  /** Project Type */
  type: ProjectType;
  /** List of assigned user IDs */
  users?: number[];
}

export interface ProjectsDashboardItem {
  /** Billable amount contains billable task time and billable expenses */
  billableAmount?: number;
  /** Billable amount only for expenses */
  billableAmountExpenses?: number;
  /** Billable amount only for task time */
  billableAmountTime?: number;
  /** Billable expenses total. This value contains all billable expenses for the selected period unlike billableAmountTime which can ignore billable expenses for fixed fee projects. */
  billableExpenses?: number;
  /** Billable task time total */
  billableTime?: number;
  /** Project billing type */
  billingType?: BillingType;
  /** Client ID */
  clientId?: number;
  /** Client name */
  clientName?: string;
  /** Total costs contains labor costs for task time plus cost expenses */
  costs?: number;
  /** Costs of expenses */
  costsExpenses?: number;
  /** Costs of task time */
  costsTime?: number;
  /** Total expenses amount contains all expenses types */
  expenses?: number;
  /** Non-billable task time */
  nonBillableTime?: number;
  /** Profit is billable amount minus costs */
  profit?: number;
  /** Costs for all time ignoring date filter. Used to calculate profit for fixed fee projects. */
  profitCosts?: number;
  /** Project ID */
  projectId?: string;
  /** Project name */
  projectName?: string;
  /** Project status */
  projectStatus?: ProjectStatusType;
  /** Separate expenses total */
  separateExpenses?: number;
  /** Time total */
  time?: number;
  /** How match task time was recorded via timer in % */
  timerTimePc?: number;
  /** Univoiced amount */
  uninvoicedAmount?: number;
  /** Workspace ID */
  workspaceId?: string;
  /** Workspace name */
  workspaceName?: string;
}

export type ProjectStatusType = "open" | "archived";

export interface RemoveTimeRecordRequest {
  /** Date */
  date: string;
  /** User ID */
  user?: number;
}

export interface Section {
  id: number;
  name: string;
  position: number;
  project: string;
  status?: SectionStatusType;
}

export type SectionStatusType = "open" | "archived";

export interface SectionRequest {
  name: string;
  position?: number;
  status?: SectionStatusType;
}

export interface Task {
  attributes?: TaskAttributes;
  description?: string;
  /** Format: Y-m-d H:i:s */
  dueAt?: string;
  estimate?: TaskEstimate;
  id: string;
  labels?: string[];
  metrics?: TaskMetrics;
  name: string;
  position?: number;
  projects: string[];
  /** Section ID */
  section?: number;
  status?: TaskStatusType;
  time?: TaskTime;
  unbillable?: boolean;
}

export type TaskStatusType = "open" | "closed";

/**
 * Custom attributes from integration
 */
export interface TaskAttributes {
  /** example of custom attribute Client */
  client?: string;
  /** example of custom attribute Priority */
  priority?: string;
}

export interface TaskEstimate {
  /** Total task estimate in seconds */
  total: number;
  type: TaskEstimateType;
  users?: UserSpecificValue;
}

export type TaskEstimateType = "overall" | "users";

export interface UserSpecificValue {
  /** Value for user ID */
  [userId: string]: number;
}

/**
 * Custom metrics from integration
 */
export interface TaskMetrics {
  /** example of custome metric efforts */
  efforts?: number;
  /** example of custome metric expenses */
  expenses?: number;
}

export interface TaskRequest {
  description?: string;
  /** Format: Y-m-d */
  dueOn?: string;
  labels?: string[];
  name: string;
  position?: number;
  /** Section ID */
  section: number;
  status?: TaskType;
}

export type TaskType = "open" | "closed";

export interface TaskTime {
  /** Total task time in seconds */
  total: number;
  users?: UserSpecificValue;
}

export interface TimeExportObject {
  /** Will appear only if 'date' passed to `fields` parameter */
  date?: string;
  project?: EstimateExportObjectProject;
  task?: EstimateExportObjectTask;
  /** Report time in seconds */
  time: number;
  user?: TimeExportObjectUser;
}

/**
 * Will appear only if 'user' passed to `fields` parameter
 */
export interface TimeExportObjectUser {
  id: number;
  name: string;
}

export interface TimeHistory {
  action: TimeRecordAction;
  createdAt?: string;
  /** User ID */
  createdBy: number;
  /** Time record history ID */
  id: number;
  /** Previous time in seconds */
  previousTime: number;
  /** Time difference in seconds */
  time: number;
}

export type TimeRecordAction =
  | "TIMER"
  | "ADD"
  | "EDIT"
  | "REMOVE"
  | "COMMENT"
  | "MOVE";

export interface TimeRecord {
  comment?: string;
  /** Date */
  date: string;
  history?: TimeHistory[];
  /** Time record ID */
  id: number;
  isInvoiced?: boolean;
  isLocked?: boolean;
  task?: Task;
  /** Time recorded in seconds */
  time: number;
  /** User ID */
  user: number;
}

export type UserTimeRecord = Omit<TimeRecord, "history">;

export interface TimeRecordRequest {
  /** Comment */
  comment?: string;
  /** Date */
  date: string;
  /** Time in seconds */
  time: number;
  /** User ID */
  user?: number;
}

export interface Timecard {
  /** Breaks duration in secods */
  breakTime?: number;
  /** Clock-in time in user timezone */
  clockIn?: string;
  /** Clock-out time in user timezone */
  clockOut?: string;
  history?: TimecardHistory[];
  /** User ID */
  user?: number;
  /** Working time in seconds (formula: clock-out - clock-in - breaks) */
  workTime?: number;
}

export interface TimecardHistory {
  /** What data are changed */
  action?: TimecardActionType;
  /** Old value for clockIn, clockOut or break */
  previousTime?: string;
  /** New value for clockIn, clockOut or break */
  time?: string;
  /** Action */
  trigger?: TimecardTriggerType;
}

export type TimecardActionType = "clock-in" | "clock-out" | "break";

export type TimecardTriggerType =
  | "manually"
  | "timer"
  | "button"
  | "day-end"
  | "idle-state";

export interface Timer {
  comment?: string;
  /** Timer duration in seconds */
  duration?: number;
  startedAt?: string;
  status: TimerStatusType;
  task?: Task;
  /** Today time by user in the timer task */
  today?: number;
  user?: User;
  userDate?: string;
}

export type TimerStatusType = "active" | "stopped";

export interface TimerRequest {
  comment?: string;
  task: string;
  userDate?: string;
}

export interface User {
  avatarUrl?: string;
  headline?: string;
  id: number;
  name: string;
  role: UserRoleType;
  status: UserStatusType;
}

export interface UsersDashboardItem {
  /** Billable amount contains billable task time and billable expenses */
  billableAmount?: number;
  /** Billable amount only for expenses */
  billableAmountExpenses?: number;
  /** Billable amount only for task time */
  billableAmountTime?: number;
  /** Billable expenses total. This value contains all billable expenses for the selected period unlike billableAmountTime which can ignore billable expenses for fixed fee projects. */
  billableExpenses?: number;
  /** Billable task time total */
  billableTime?: number;
  /** Total costs contains labor costs for task time and time off plus cost expenses */
  costs?: number;
  /** Costs of expenses */
  costsExpenses?: number;
  /** Costs of task time */
  costsTime?: number;
  /** Costs of time off */
  costsTimeOff?: number;
  /** Total expenses amount contains all expenses types */
  expenses?: number;
  /** Avatar URL */
  memberAvatarUrl?: string;
  /** Job title */
  memberHeadline?: string;
  /** User ID */
  memberId?: number;
  /** User name */
  memberName?: string;
  /** User status */
  memberStatus?: UserStatusType;
  /** Non-billable time total (non-billable task time and time off) */
  nonBillableTime?: number;
  /** Profit is billable amount minus costs */
  profit?: number;
  /** Costs for all time ignoring date filter. Used to calculate profit for fixed fee projects. */
  profitCosts?: number;
  /** Separate expenses total */
  separateExpenses?: number;
  /** Time total (task time and time off) */
  time?: number;
  /** Time off total in days */
  timeOffDays?: number;
  /** Time off total in seconds */
  timeOffTime?: number;
  /** How match task time was recorded via timer in % */
  timerTimePc?: number;
  /** Uninvoiced amount */
  uninvoicedAmount?: number;
}

export interface Webhook {
  /** Datetime when webhook was created (format: Y-m-d H:i:s) */
  createdAt: string;
  /** List of events you want to receive */
  events: WebhookEventType[];
  /** Webhook ID */
  id: number;
  isActive?: boolean;
  /** Datetime when webhook was last used (format: Y-m-d H:i:s) */
  lastUsedAt: string;
  /** You can receive events only for specific project */
  project?: string;
  targetUrl: string;
}

/**
 * @summary Add Attachment To Expense
 * @param {number} expenseId Expense ID
 * @param {AttachmentRequest} [payload]
 * @throws {RequiredError}
 */
export async function addAttachmentToExpense(
  client: EverhourApiClient,
  expenseId: number,
  payload: AttachmentRequest,
): Promise<AttachmentDetails> {
  const url = client.createUrl("/expenses/{expenseId}/attachments", {
    expenseId,
  });
  return await client.apiRequest("POST", url, payload);
}

/**
 * @summary Add Time
 * @param {string} taskId Task ID
 * @param {TimeRecordRequest} [payload]
 * @throws {RequiredError}
 */
export async function addTime(
  client: EverhourApiClient,
  taskId: string,
  payload: TimeRecordRequest,
): Promise<TimeRecord> {
  const url = client.createUrl("/tasks/{taskId}/time", { taskId });
  return await client.apiRequest("POST", url, payload);
}

/**
 * @summary Clients Report
 * @param {string} [dateGte] Report start date, ex: `2020-12-31`
 * @param {string} [dateLte] Report end date, ex: `2020-12-31`
 * @param {string} [projectId] Filter by project ID
 * @param {number} [clientId] Filter by client ID
 * @param {number} [memberId] Filter by user ID
 * @throws {RequiredError}
 */
export async function clientsReport(
  client: EverhourApiClient,
  dateGte?: string,
  dateLte?: string,
  projectId?: string,
  clientId?: number,
  memberId?: number,
): Promise<ClientsDashboardItem[]> {
  const url = client.createUrl(
    "/dashboards/clients",
    {},
    {
      date_gte: dateGte,
      date_lte: dateLte,
      projectId,
      clientId,
      memberId,
    },
  );

  return await client.apiRequest("GET", url);
}

/**
 * @summary Clock In
 * @param {number} userId User ID
 * @param {TimecardActionRequest} [payload]
 * @throws {RequiredError}
 */
export async function clockIn(
  client: EverhourApiClient,
  userId: number,
  payload: TimecardActionRequest,
): Promise<Timecard> {
  const url = client.createUrl("/users/{userId}/timecards/clock-in", {
    userId,
  });
  return await client.apiRequest("POST", url, payload);
}

/**
 * @summary Clock Out
 * @param {number} userId User ID
 * @param {TimecardActionRequest} [payload]
 * @throws {RequiredError}
 */
export async function clockOut(
  client: EverhourApiClient,
  userId: number,
  payload: TimecardActionRequest,
): Promise<Timecard> {
  const url = client.createUrl("/users/{userId}/timecards/clock-out", {
    userId,
  });
  return await client.apiRequest("POST", url, payload);
}

/**
 * @summary Create Assignment
 * @param {AssignmentRequest} [payload]
 * @throws {RequiredError}
 */
export async function createAssignment(
  client: EverhourApiClient,
  payload: AssignmentRequest,
): Promise<Assignment> {
  const url = client.createUrl("/resource-planner/assignments");
  return await client.apiRequest("POST", url, payload);
}

/**
 * @summary Create Attachment
 * @param {AttachmentRequest} [payload]
 * @throws {RequiredError}
 */
export async function createAttachment(
  client: EverhourApiClient,
  payload: AttachmentRequest,
): Promise<AttachmentDetails> {
  const url = client.createUrl("/attachments");
  return await client.apiRequest("POST", url, payload);
}

/**
 * @summary Create Category
 * @param {ExpenseCategoryRequest} [payload]
 * @throws {RequiredError}
 */
export async function createCategory(
  client: EverhourApiClient,
  payload: ExpenseCategoryRequest,
): Promise<ExpenseCategory> {
  const url = client.createUrl("/expenses/categories");
  return await client.apiRequest("POST", url, payload);
}

/**
 * @summary Create Client
 * @param {ClientRequest} [payload]
 * @throws {RequiredError}
 */
export async function createClient(
  client: EverhourApiClient,
  payload: ClientRequest,
): Promise<Client> {
  const url = client.createUrl("/clients");
  return await client.apiRequest("POST", url, payload);
}

/**
 * @summary Create Expense
 * @param {ExpenseRequest} [payload]
 * @throws {RequiredError}
 */
export async function createExpense(
  client: EverhourApiClient,
  payload: ExpenseRequest,
): Promise<Expense> {
  const url = client.createUrl("/expenses");
  return await client.apiRequest("POST", url, payload);
}

/**
 * @summary Create Invoice
 * @param {number} clientId Client ID
 * @param {InvoiceCreateRequest} [payload]
 * @throws {RequiredError}
 */
export async function createInvoice(
  client: EverhourApiClient,
  clientId: number,
  payload: InvoiceCreateRequest,
): Promise<Invoice> {
  const url = client.createUrl("/clients/{clientId}/invoices", { clientId });
  return await client.apiRequest("POST", url, payload);
}

/**
 * @summary Create Project
 * @param {ProjectRequest} [payload]
 * @throws {RequiredError}
 */
export async function createProject(
  client: EverhourApiClient,
  payload: ProjectRequest,
): Promise<Project> {
  const url = client.createUrl("/projects");
  return await client.apiRequest("POST", url, payload);
}

/**
 * @summary Create Section
 * @param {string} projectId Project ID
 * @param {SectionRequest} [payload]
 * @throws {RequiredError}
 */
export async function createSection(
  client: EverhourApiClient,
  projectId: string,
  payload: SectionRequest,
): Promise<Section> {
  const url = client.createUrl("/projects/{projectId}/sections", { projectId });
  return await client.apiRequest("POST", url, payload);
}

/**
 * @summary Create Task
 * @param {string} projectId Project ID
 * @param {TaskRequest} [payload]
 * @throws {RequiredError}
 */
export async function createTask(
  client: EverhourApiClient,
  projectId: string,
  payload: TaskRequest,
): Promise<Task> {
  const url = client.createUrl("/projects/{projectId}/tasks", { projectId });
  return await client.apiRequest("POST", url, payload);
}

/**
 * @summary Create Webhook
 * @param {WebhookRequest} [payload]
 * @throws {RequiredError}
 */
export async function createWebhook(
  client: EverhourApiClient,
  payload: WebhookRequest,
): Promise<Webhook> {
  const url = client.createUrl("/hooks");
  return await client.apiRequest("POST", url, payload);
}

/**
 * @summary Delete Assignment
 * @param {number} assignmentId Assignment ID
 * @throws {RequiredError}
 */
export async function deleteAssignment(
  client: EverhourApiClient,
  assignmentId: number,
): Promise<Response> {
  const url = client.createUrl("/resource-planner/assignments/{assignmentId}", {
    assignmentId,
  });
  return await client.apiRequest("DELETE", url);
}

/**
 * @summary Delete Attachment
 * @param {number} attachmentId Attachment ID
 * @throws {RequiredError}
 */
export async function deleteAttachment(
  client: EverhourApiClient,
  attachmentId: number,
): Promise<Response> {
  const url = client.createUrl("/attachments/{attachmentId}", { attachmentId });
  return await client.apiRequest("DELETE", url);
}

/**
 * @summary Delete Category
 * @param {number} categoryId Expense Category ID
 * @param {ExpenseCategoryDeleteRequest} [payload]
 * @throws {RequiredError}
 */
export async function deleteCategory(
  client: EverhourApiClient,
  categoryId: number,
  payload: ExpenseCategoryDeleteRequest,
): Promise<Response> {
  const url = client.createUrl("/expenses/categories/{categoryId}", {
    categoryId,
  });
  return await client.apiRequest("DELETE", url, payload);
}

/**
 * @summary Delete Client Budget
 * @param {number} clientId Client ID
 * @throws {RequiredError}
 */
export async function deleteBudget(
  client: EverhourApiClient,
  clientId: number,
): Promise<Response> {
  const url = client.createUrl("/clients/{clientId}/budget", { clientId });
  return await client.apiRequest("DELETE", url);
}

/**
 * @summary Delete Expense
 * @param {number} expenseId Expense ID
 * @throws {RequiredError}
 */
export async function deleteExpense(
  client: EverhourApiClient,
  expenseId: number,
): Promise<Response> {
  const url = client.createUrl("/expenses/{expenseId}", { expenseId });
  return await client.apiRequest("DELETE", url);
}

/**
 * @summary Delete Invoice
 * @param {number} invoiceId Invoice ID
 * @throws {RequiredError}
 */
export async function deleteInvoice(
  client: EverhourApiClient,
  invoiceId: number,
): Promise<Response> {
  const url = client.createUrl("/invoices/{invoiceId}", { invoiceId });
  return await client.apiRequest("DELETE", url);
}

/**
 * @summary Delete Project
 * @param {string} projectId Project ID
 * @throws {RequiredError}
 */
export async function deleteProject(
  client: EverhourApiClient,
  projectId: string,
): Promise<Response> {
  const url = client.createUrl("/projects/{projectId}", { projectId });
  return await client.apiRequest("DELETE", url);
}

/**
 * @summary Delete Section
 * @param {number} sectionId Section ID
 * @throws {RequiredError}
 */
export async function deleteSection(
  client: EverhourApiClient,
  sectionId: number,
): Promise<Response> {
  const url = client.createUrl("/sections/{sectionId}", { sectionId });
  return await client.apiRequest("DELETE", url);
}

/**
 * @summary Delete Task
 * @param {string} taskId Task ID
 * @throws {RequiredError}
 */
export async function deleteTask(
  client: EverhourApiClient,
  taskId: string,
): Promise<Response> {
  const url = client.createUrl("/tasks/{taskId}", { taskId });
  return await client.apiRequest("DELETE", url);
}

/**
 * @summary Delete Task Estimate
 * @param {string} taskId Task ID
 * @throws {RequiredError}
 */
export async function deleteTaskEstimate(
  client: EverhourApiClient,
  taskId: string,
): Promise<Response> {
  const url = client.createUrl("/tasks/{taskId}/estimate", { taskId });
  return await client.apiRequest("DELETE", url);
}

/**
 * @summary Delete Time Record
 * @param {string} taskId Task ID
 * @param {RemoveTimeRecordRequest} [payload]
 * @throws {RequiredError}
 */
export async function deleteTimeRecord(
  client: EverhourApiClient,
  taskId: string,
  payload: RemoveTimeRecordRequest,
): Promise<TimeRecord> {
  const url = client.createUrl("/tasks/{taskId}/time", { taskId });
  return await client.apiRequest("DELETE", url, payload);
}

/**
 * @summary Delete Timecard
 * @param {number} userId User ID
 * @param {string} date Date, ex: `2020-12-31`
 * @throws {RequiredError}
 */
export async function deleteTimecard(
  client: EverhourApiClient,
  userId: number,
  date: string,
): Promise<Response> {
  const url = client.createUrl("/users/{userId}/timecards/{date}", {
    userId,
    date,
  });
  return await client.apiRequest("DELETE", url);
}

/**
 * @summary Delete Webhook
 * @param {number} hookId Webhook ID
 * @throws {RequiredError}
 */
export async function deleteWebhook(
  client: EverhourApiClient,
  hookId: number,
): Promise<Response> {
  const url = client.createUrl("/hooks/{hookId}", { hookId });
  return await client.apiRequest("DELETE", url);
}

/**
 * @summary Download Attachment
 * @param {string} attachmentToken
 * @throws {RequiredError}
 */
export async function downloadAttachment(
  client: EverhourApiClient,
  attachmentToken: string,
): Promise<Response> {
  const url = client.createUrl("/attachments/{attachmentToken}/download", {
    attachmentToken,
  });
  return await client.apiRequest("GET", url);
}

/**
 * @summary Estimates Report (deprecated)
 * @param {string} [dueFrom] Task due date, ex: `2020-12-31` from you what to fetch estimates (format YYYY-MM-DD)
 * @param {string} [dueTo] Task due date, ex: `2020-12-31` to you what to fetch estimates (format YYYY-MM-DD)
 * @param {string} [status] Task status (e.g. open or completed)
 * @throws {RequiredError}
 */
export async function estimatesReportDeprecated(
  client: EverhourApiClient,
  dueFrom?: string,
  dueTo?: string,
  status?: "open" | "completed",
): Promise<EstimateExportObject[]> {
  const url = client.createUrl(
    "/team/estimate/export",
    {},
    { dueFrom, dueTo, status },
  );
  return await client.apiRequest("GET", url);
}

/**
 * @summary Export Invoice to Xero/QB/FB
 * @param {number} invoiceId Invoice ID
 * @throws {RequiredError}
 */
export async function exportInvoiceToXeroQBFB(
  client: EverhourApiClient,
  invoiceId: number,
): Promise<Invoice> {
  const url = client.createUrl("/invoices/{invoiceId}/export", { invoiceId });
  return await client.apiRequest("POST", url);
}

/**
 * @summary Get All Assignments
 * @param {string} [type] Filter by Assingment Type  + `time-off`  + `assignment`
 * @param {string} [project] Filter by Project ID
 * @param {string} [task] Filter by Task ID
 * @param {number} [client] Filter by Client ID
 * @param {string} [from] Get Assignments Starting From
 * @param {string} [to] Get Assignments Ending At
 * @throws {RequiredError}
 */
export async function getAllAssignments(
  apiClient: EverhourApiClient,
  type?: string,
  project?: string,
  task?: string,
  client?: number,
  from?: string,
  to?: string,
): Promise<Assignment[]> {
  const url = apiClient.createUrl(
    "/resource-planner/assignments",
    {},
    { type, project, task, client, from, to },
  );
  return await apiClient.apiRequest("GET", url);
}

/**
 * @summary Get All Categories
 * @throws {RequiredError}
 */
export async function getAllCategories(
  client: EverhourApiClient,
): Promise<ExpenseCategory[]> {
  const url = client.createUrl("/expenses/categories");
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get All Clients
 * @param {string} [query] Search Clients by Name
 * @throws {RequiredError}
 */
export async function getAllClients(
  client: EverhourApiClient,
  query?: string,
): Promise<Client[]> {
  const url = client.createUrl("/clients", {}, { query });
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get All Expenses
 * @throws {RequiredError}
 */
export async function getAllExpenses(
  client: EverhourApiClient,
): Promise<Expense[]> {
  const url = client.createUrl("/expenses");
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get All Invoices
 * @throws {RequiredError}
 */
export async function getAllInvoices(
  client: EverhourApiClient,
): Promise<Invoice[]> {
  const url = client.createUrl("/invoices");
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get All Projects
 * @param {number} [limit] Max Results
 * @param {string} [query] Search Projects by Name
 * @param {'as' | 'ev' | 'b3' | 'b2' | 'pv' | 'gh' | 'in' | 'tr' | 'jr'} [platform] Filter by Integration
 * @throws {RequiredError}
 */
export async function getAllProjects(
  client: EverhourApiClient,
  limit?: number,
  query?: string,
  platform?: "as" | "ev" | "b3" | "b2" | "pv" | "gh" | "in" | "tr" | "jr",
): Promise<Project[]> {
  const url = client.createUrl("/projects", {}, { limit, query, platform });
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get All Team Timers
 * @throws {RequiredError}
 */
export async function getAllTeamTimers(
  client: EverhourApiClient,
): Promise<Timer[]> {
  const url = client.createUrl("/team/timers");
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get All Time Records
 * @param {string} [from] Date from
 * @param {string} [to] Date to
 * @param {number} [limit] Max results for pagination
 * @param {number} [page] Page
 * @throws {RequiredError}
 */
export async function getAllTimeRecords(
  client: EverhourApiClient,
  from?: string,
  to?: string,
  limit?: number,
  page?: number,
): Promise<TimeRecord[]> {
  const url = client.createUrl("/team/time", {}, { from, to, limit, page });
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get All Timecards
 * @param {string} [from] Date from (2 weeks ago by default)
 * @param {string} [to] Date to
 * @throws {RequiredError}
 */
export async function getAllTimecards(
  client: EverhourApiClient,
  from?: string,
  to?: string,
): Promise<Timecard[]> {
  const url = client.createUrl("/timecards", {}, { from, to });
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get All Users
 * @throws {RequiredError}
 */
export async function getAllUsers(client: EverhourApiClient): Promise<User[]> {
  const url = client.createUrl("/team/users");
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get Client
 * @param {number} clientId Client ID
 * @throws {RequiredError}
 */
export async function getClient(
  client: EverhourApiClient,
  clientId: number,
): Promise<Client> {
  const url = client.createUrl("/clients/{clientId}", { clientId });
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get Current User
 * @throws {RequiredError}
 */
export async function getCurrentUser(client: EverhourApiClient): Promise<User> {
  const url = client.createUrl("/users/me");
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get Invoice
 * @param {number} invoiceId Invoice ID
 * @throws {RequiredError}
 */
export async function getInvoice(
  client: EverhourApiClient,
  invoiceId: number,
): Promise<Invoice> {
  const url = client.createUrl("/invoices/{invoiceId}", { invoiceId });
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get Project
 * @param {string} projectId Project ID
 * @throws {RequiredError}
 */
export async function getProject(
  client: EverhourApiClient,
  projectId: string,
): Promise<Project> {
  const url = client.createUrl("/projects/{projectId}", { projectId });
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get Project Sections
 * @param {string} projectId Project ID
 * @throws {RequiredError}
 */
export async function getProjectSections(
  client: EverhourApiClient,
  projectId: string,
): Promise<Section[]> {
  const url = client.createUrl("/projects/{projectId}/sections", { projectId });
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get Project Tasks
 * @param {string} projectId Project ID
 * @param {number} [page] Results page
 * @param {number} [limit] Tasks per page, 250 max
 * @param {boolean} [excludeClosed] Exclude closed/completed tasks
 * @param {string} [query] Search tasks by name
 * @throws {RequiredError}
 */
export async function getProjectTasks(
  client: EverhourApiClient,
  projectId: string,
  page?: number,
  limit?: number,
  excludeClosed?: boolean,
  query?: string,
): Promise<Task[]> {
  const url = client.createUrl(
    "/projects/{projectId}/tasks",
    { projectId },
    { page, limit, excludeClosed, query },
  );
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get Project Time Records
 * @param {string} projectId Project ID
 * @param {string} [from] Date from
 * @param {string} [to] Date to
 * @param {number} [limit] Max results for pagination
 * @param {number} [page] Page
 * @throws {RequiredError}
 */
export async function getProjectTimeRecords(
  client: EverhourApiClient,
  projectId: string,
  from?: string,
  to?: string,
  limit?: number,
  page?: number,
): Promise<TimeRecord[]> {
  const url = client.createUrl(
    "/projects/{projectId}/time",
    { projectId },
    { from, to, limit, page },
  );
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get Running Timer
 * @throws {RequiredError}
 */
export async function getRunningTimer(
  client: EverhourApiClient,
): Promise<Timer> {
  const url = client.createUrl("/timers/current");
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get Section
 * @param {number} sectionId Section ID
 * @throws {RequiredError}
 */
export async function getSection(
  client: EverhourApiClient,
  sectionId: number,
): Promise<Section> {
  const url = client.createUrl("/sections/{sectionId}", { sectionId });
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get Task
 * @throws {RequiredError}
 */
export async function getTask(client: EverhourApiClient): Promise<Task> {
  const url = client.createUrl("/tasks/{taskId}");
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get Task Time Records
 * @param {string} taskId Task ID
 * @param {string} [from] Date from
 * @param {string} [to] Date to
 * @param {number} [limit] Max results for pagination
 * @param {number} [page] Page
 * @throws {RequiredError}
 */
export async function getTaskTimeRecords(
  client: EverhourApiClient,
  taskId: string,
  from?: string,
  to?: string,
  limit?: number,
  page?: number,
): Promise<TimeRecord[]> {
  const url = client.createUrl(
    "/tasks/{taskId}/time",
    { taskId },
    { from, to, limit, page },
  );
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get Timecard
 * @param {number} userId User ID
 * @param {string} date Date, ex: `2020-12-31`
 * @throws {RequiredError}
 */
export async function getTimecard(
  client: EverhourApiClient,
  userId: number,
  date: string,
): Promise<Timecard> {
  const url = client.createUrl("/users/{userId}/timecards/{date}", {
    userId,
    date,
  });
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get User Time Records
 * @param {number} userId User ID
 * @param {string} [from] Date from
 * @param {string} [to] Date to
 * @param {number} [limit] Max results for pagination
 * @param {number} [page] Page
 * @throws {RequiredError}
 */
export async function getUserTimeRecords(
  client: EverhourApiClient,
  userId: number,
  from?: string,
  to?: string,
  limit?: number,
  page?: number,
): Promise<UserTimeRecord[]> {
  const url = client.createUrl(
    "/users/{userId}/time",
    { userId },
    { from, to, limit, page },
  );
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get User Timecards
 * @param {number} userId User ID
 * @param {string} [from] Date from (2 weeks ago by default)
 * @param {string} [to] Date to
 * @throws {RequiredError}
 */
export async function getUserTimecards(
  client: EverhourApiClient,
  userId: number,
  from?: string,
  to?: string,
): Promise<Timecard[]> {
  const url = client.createUrl(
    "/users/{userId}/timecards",
    { userId },
    { from, to },
  );
  return await client.apiRequest("GET", url);
}

/**
 * @summary Get Webhook
 * @param {number} hookId Webhook ID
 * @throws {RequiredError}
 */
export async function getWebhook(
  client: EverhourApiClient,
  hookId: number,
): Promise<Webhook> {
  const url = client.createUrl("/hooks/{hookId}", { hookId });
  return await client.apiRequest("GET", url);
}

/**
 * @summary Mark Invoice as Draft/Sent/Paid
 * @param {number} invoiceId Invoice ID
 * @param {string} status Invoice Status  + `draft`  + `sent`  + `paid`
 * @throws {RequiredError}
 */
export async function markInvoiceAsDraftSentPaid(
  client: EverhourApiClient,
  invoiceId: number,
  status: string,
): Promise<Invoice> {
  const url = client.createUrl("/invoices/{invoiceId}/{status}", {
    invoiceId,
    status,
  });
  return await client.apiRequest("POST", url);
}

/**
 * @summary Projects Report
 * @param {string} [dateGte] Report start date, ex: `2020-12-31`
 * @param {string} [dateLte] Report end date, ex: `2020-12-31`
 * @param {string} [projectId] Filter by project ID
 * @param {number} [clientId] Filter by client ID
 * @param {number} [memberId] Filter by user ID
 * @throws {RequiredError}
 */
export async function projectsReport(
  client: EverhourApiClient,
  dateGte?: string,
  dateLte?: string,
  projectId?: string,
  clientId?: number,
  memberId?: number,
): Promise<ProjectsDashboardItem[]> {
  const url = client.createUrl(
    "/dashboards/projects",
    {},
    {
      date_gte: dateGte,
      date_lte: dateLte,
      projectId,
      clientId,
      memberId,
    },
  );
  return await client.apiRequest("GET", url);
}

/**
 * @summary Refresh Invoice Line Items
 * @param {number} invoiceId Invoice ID
 * @param {InvoiceRefreshRequest} [payload]
 * @throws {RequiredError}
 */
export async function refreshInvoiceLineItems(
  client: EverhourApiClient,
  invoiceId: number,
  payload: InvoiceRefreshRequest,
): Promise<Invoice> {
  const url = client.createUrl("/invoices/{invoiceId}/reset-time", {
    invoiceId,
  });
  return await client.apiRequest("POST", url, payload);
}

/**
 * @summary Search Project Tasks
 * @param {string} projectId Project ID
 * @param {string} [query] Search query
 * @param {number} [limit] Max number of search results
 * @param {boolean} [searchInClosed] Should do we search in closed/completed tasks?
 * @throws {RequiredError}
 */
export async function searchProjectTasks(
  client: EverhourApiClient,
  projectId: string,
  query?: string,
  limit?: number,
  searchInClosed?: boolean,
): Promise<Task[]> {
  const url = client.createUrl(
    "/projects/{projectId}/tasks/search",
    { projectId },
    { query, limit, searchInClosed },
  );
  return await client.apiRequest("GET", url);
}

/**
 * @summary Search Tasks
 * @param {string} [query] Search query
 * @param {number} [limit] Max number of search results
 * @param {boolean} [searchInClosed] Should do we search in closed/completed tasks?
 * @throws {RequiredError}
 */
export async function searchTasks(
  client: EverhourApiClient,
  query?: string,
  limit?: number,
  searchInClosed?: boolean,
): Promise<Task[]> {
  const url = client.createUrl(
    "/tasks/search",
    {},
    { query, limit, searchInClosed },
  );
  return await client.apiRequest("GET", url);
}

/**
 * @summary Start Timer
 * @param {TimerRequest} [payload]
 * @throws {RequiredError}
 */
export async function startTimer(
  client: EverhourApiClient,
  payload: TimerRequest,
): Promise<Timer> {
  const url = client.createUrl("/timers");
  return await client.apiRequest("POST", url, payload);
}

/**
 * @summary Stop Timer
 * @throws {RequiredError}
 */
export async function stopTimer(client: EverhourApiClient): Promise<Timer> {
  const url = client.createUrl("/timers/current");
  return await client.apiRequest("DELETE", url);
}

/**
 * @summary Time Report (deprecated)
 * @param {string} [from] Date from you what to fetch reported time (format YYYY-MM-DD)
 * @param {string} [to] Date to you what to fetch reported time (format YYYY-MM-DD)
 * @param {string} [fields] Comma separated objects to group by and fetch (allowed: user, project, task and date, ex: `2020-12-31`).
 * @throws {RequiredError}
 */
export async function timeReportDeprecated(
  client: EverhourApiClient,
  from?: string,
  to?: string,
  fields?: string,
): Promise<TimeExportObject[]> {
  const url = client.createUrl("/team/time/export", {}, { from, to, fields });
  return await client.apiRequest("GET", url);
}

/**
 * @summary Update Assignment
 * @param {number} assignmentId Assignment ID
 * @param {AssignmentRequest} [payload]
 * @throws {RequiredError}
 */
export async function updateAssignment(
  client: EverhourApiClient,
  assignmentId: number,
  payload: AssignmentRequest,
): Promise<Assignment> {
  const url = client.createUrl("/resource-planner/assignments/{assignmentId}", {
    assignmentId,
  });
  return await client.apiRequest("PUT", url, payload);
}

/**
 * @summary Update Category
 * @param {number} categoryId Expense Category ID
 * @param {ExpenseCategoryRequest} [payload]
 * @throws {RequiredError}
 */
export async function updateCategory(
  client: EverhourApiClient,
  categoryId: number,
  payload: ExpenseCategoryRequest,
): Promise<ExpenseCategory> {
  const url = client.createUrl("/expenses/categories/{categoryId}", {
    categoryId,
  });
  return await client.apiRequest("PUT", url, payload);
}

/**
 * @summary Update Client
 * @param {number} clientId Client ID
 * @param {ClientRequest} [payload]
 * @throws {RequiredError}
 */
export async function updateClient(
  client: EverhourApiClient,
  clientId: number,
  payload: ClientRequest,
): Promise<Client> {
  const url = client.createUrl("/clients/{clientId}", { clientId });
  return await client.apiRequest("PUT", url, payload);
}

/**
 * @summary Update Client Budget
 * @param {number} clientId Client ID
 * @param {Budget} [payload]
 * @throws {RequiredError}
 */
export async function updateBudget(
  client: EverhourApiClient,
  clientId: number,
  payload: BudgetRequest,
): Promise<Client> {
  const url = client.createUrl("/clients/{clientId}/budget", { clientId });
  return await client.apiRequest("PUT", url, payload);
}

/**
 * @summary Update Expense
 * @param {number} expenseId Expense ID
 * @param {ExpenseRequest} [payload]
 * @throws {RequiredError}
 */
export async function updateExpense(
  client: EverhourApiClient,
  expenseId: number,
  payload: ExpenseRequest,
): Promise<Expense> {
  const url = client.createUrl("/expenses/{expenseId}", { expenseId });
  return await client.apiRequest("PUT", url, payload);
}

/**
 * @summary Update Invoice
 * @param {number} invoiceId Invoice ID
 * @param {InvoiceUpdateRequest} [payload]
 * @throws {RequiredError}
 */
export async function updateInvoice(
  client: EverhourApiClient,
  invoiceId: number,
  payload: InvoiceUpdateRequest,
): Promise<Invoice> {
  const url = client.createUrl("/invoices/{invoiceId}", { invoiceId });
  return await client.apiRequest("PUT", url, payload);
}

/**
 * @summary Update Project
 * @param {string} projectId Project ID
 * @param {ProjectRequest} [payload]
 * @throws {RequiredError}
 */
export async function updateProject(
  client: EverhourApiClient,
  projectId: string,
  payload: ProjectRequest,
): Promise<Project> {
  const url = client.createUrl("/projects/{projectId}", { projectId });
  return await client.apiRequest("PUT", url, payload);
}

/**
 * @summary Update Project Billing/Budget
 * @param {string} projectId Project ID
 * @param {ProjectBillingBudgetRequest} [payload]
 * @param {string} [example] e.g. : Hourly project
 * @throws {RequiredError}
 */
export async function updateProjectBillingBudget(
  client: EverhourApiClient,
  projectId: string,
  payload: ProjectBillingBudgetRequest,
  example?: string,
): Promise<Project> {
  const url = client.createUrl(
    "/projects/{projectId}/billing",
    { projectId },
    { example },
  );
  return await client.apiRequest("PUT", url, payload);
}

/**
 * @summary Update Section
 * @param {number} sectionId Section ID
 * @param {SectionRequest} [payload]
 * @throws {RequiredError}
 */
export async function updateSection(
  client: EverhourApiClient,
  sectionId: number,
  payload: SectionRequest,
): Promise<Section> {
  const url = client.createUrl("/sections/{sectionId}", { sectionId });
  return await client.apiRequest("PUT", url, payload);
}

/**
 * @summary Update Task
 * @param {string} taskId Task ID
 * @param {TaskRequest} [payload]
 * @throws {RequiredError}
 */
export async function updateTask(
  client: EverhourApiClient,
  taskId: string,
  payload: TaskRequest,
): Promise<Task> {
  const url = client.createUrl("/tasks/{taskId}", { taskId });
  return await client.apiRequest("PUT", url, payload);
}

/**
 * @summary Update Task Estimate
 * @param {string} taskId Task ID
 * @param {TaskEstimate} [payload]
 * @throws {RequiredError}
 */
export async function updateTaskEstimate(
  client: EverhourApiClient,
  taskId: string,
  payload: TaskEstimate,
): Promise<Task> {
  const url = client.createUrl("/tasks/{taskId}/estimate", { taskId });
  return await client.apiRequest("PUT", url, payload);
}

/**
 * @summary Update Time Record
 * @param {string} taskId Task ID
 * @param {TimeRecordRequest} [payload]
 * @throws {RequiredError}
 */
export async function updateTimeRecord(
  client: EverhourApiClient,
  taskId: string,
  payload: TimeRecordRequest,
): Promise<TimeRecord> {
  const url = client.createUrl("/tasks/{taskId}/time", { taskId });
  return await client.apiRequest("PUT", url, payload);
}

/**
 * @summary Update Timecard
 * @param {number} userId User ID
 * @param {string} date Date, ex: `2020-12-31`
 * @param {TimecardRequest} [payload]
 * @throws {RequiredError}
 */
export async function updateTimecard(
  client: EverhourApiClient,
  userId: number,
  date: string,
  payload: TimecardRequest,
): Promise<Timecard> {
  const url = client.createUrl("/users/{userId}/timecards/{date}", {
    userId,
    date,
  });
  return await client.apiRequest("PUT", url, payload);
}

/**
 * @summary Update Webhook
 * @param {number} hookId Webhook ID
 * @param {WebhookRequest} [payload]
 * @throws {RequiredError}
 */
export async function updateWebhook(
  client: EverhourApiClient,
  hookId: number,
  payload: WebhookRequest,
): Promise<Webhook> {
  const url = client.createUrl("/hooks/{hookId}", { hookId });
  return await client.apiRequest("PUT", url, payload);
}

/**
 * @summary Users Report
 * @param {string} [dateGte] Report start date, ex: `2020-12-31`
 * @param {string} [dateLte] Report end date, ex: `2020-12-31`
 * @param {string} [projectId] Filter by project ID
 * @param {number} [clientId] Filter by client ID
 * @param {number} [memberId] Filter by user ID
 * @throws {RequiredError}
 */
export async function usersReport(
  client: EverhourApiClient,
  dateGte?: string,
  dateLte?: string,
  projectId?: string,
  clientId?: number,
  memberId?: number,
): Promise<UsersDashboardItem[]> {
  const url = client.createUrl(
    "/dashboards/users",
    {},
    { date_gte: dateGte, date_lte: dateLte, projectId, clientId, memberId },
  );
  return await client.apiRequest("GET", url);
}
