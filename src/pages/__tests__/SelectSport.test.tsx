import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import SelectSport from '../SelectSport';

describe('SelectSport', () => {
  it('renders all sport options', () => {
    const { getByText } = renderWithProviders(<SelectSport />);
    
    expect(getByText('Choose Your Activity')).toBeInTheDocument();
    expect(getByText('Skiing')).toBeInTheDocument();
    expect(getByText('Dirt Biking')).toBeInTheDocument();
    expect(getByText('Off-Roading')).toBeInTheDocument();
    expect(getByText('Hiking')).toBeInTheDocument();
  });

  it('displays sport descriptions', () => {
    const { getByText } = renderWithProviders(<SelectSport />);
    
    expect(getByText('Hit the slopes')).toBeInTheDocument();
    expect(getByText('Conquer the trails')).toBeInTheDocument();
    expect(getByText('Adventure awaits')).toBeInTheDocument();
    expect(getByText('Explore nature')).toBeInTheDocument();
  });
});
