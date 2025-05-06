import type { ChattingMessage } from '$src/lib/types';
import type { TravelPlanRequest, TravelPlanUpdateRequest } from './type';

export class PlanApi {
  private fetchClient: typeof fetch;

  constructor(_fetch: typeof fetch) {
      this.fetchClient = _fetch;
  }

  async postMakePlan(travelRequest: TravelPlanRequest): Promise<{messages: ChattingMessage[]}> {
    const response = await this.fetchClient('/api', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(travelRequest)
    });

    const result = await response.text();
    if (!response.ok) {        
      throw new ApiError(result);
    }

    const jsonResponse = JSON.parse(result);
    return {
      messages: jsonResponse.messages,
    };
  }
  
  async updatePlan(updateRequest: TravelPlanUpdateRequest): Promise<{messages: ChattingMessage[]}> {
    const response = await this.fetchClient('/api', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(updateRequest)
    });

    const result = await response.text();
    if (!response.ok) {        
      throw new ApiError(result);
    }

    const jsonResponse = JSON.parse(result);
    return {
      messages: jsonResponse.messages,
    };
  }
}

export class ApiError extends Error {
  title: string = '';
  body: string | null = null;
  errors: string[] | null = [];

  constructor(rawData: string) {
    super(rawData);
    
    try{
      const data = JSON.parse(rawData);
      if (data.title) {
        this.title = data.title.toString();
      }
      
      if (data.body) {
        this.body = data.body?.toString();
      }
    } catch (e) {
      console.log('parse error', e);
    }
  }
}
