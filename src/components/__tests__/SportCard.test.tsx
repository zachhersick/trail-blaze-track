import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import SportCard from '../SportCard';
import { Bike } from 'lucide-react';

describe('SportCard', () => {
  it('renders sport card with name and description', () => {
    const { getByText } = renderWithProviders(
      <SportCard
        icon={Bike}
        name="Mountain Biking"
        description="Track your trails"
        color="bg-primary"
        onClick={() => {}}
      />
    );
    
    expect(getByText('Mountain Biking')).toBeInTheDocument();
    expect(getByText('Track your trails')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    const { getByText } = renderWithProviders(
      <SportCard
        icon={Bike}
        name="Mountain Biking"
        description="Track your trails"
        color="bg-primary"
        onClick={handleClick}
      />
    );
    
    await user.click(getByText('Mountain Biking'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
