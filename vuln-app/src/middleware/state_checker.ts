import { Request, Response, NextFunction } from 'express';
import { getChallengeState } from '../services/internal_api';

export function challengeChecker(challengeId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const state = await getChallengeState(challengeId);
      if (!state.enabled) {
        return res.status(404).json({
          success: false,
          message: 'Challenge not found or disabled',
        });
      }
      next();
    } catch (err) {
      next();
    }
  };
}
