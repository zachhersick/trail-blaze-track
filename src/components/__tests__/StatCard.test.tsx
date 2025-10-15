import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import StatCard from '../StatCard';
import { Gauge } from 'lucide-react';

describe('StatCard', () => {
  it('renders stat information correctly', () => {
    const { getByText } = renderWithProviders(
      <StatCard
        icon={Gauge}
        label="Speed"
        value="25.5"
        unit="km/h"
      />
    );
    
    expect(getByText('Speed')).toBeInTheDocument();
    expect(getByText('25.5')).toBeInTheDocument();
    expect(getByText('km/h')).toBeInTheDocument();
  });

  it('applies custom color class', () => {
    const { container } = renderWithProviders(
      <StatCard
        icon={Gauge}
        label="Speed"
        value="25.5"
        unit="km/h"
        color="text-primary"
      />
    );
    
    expect(container.querySelector('.text-primary')).toBeInTheDocument();
  });
});
