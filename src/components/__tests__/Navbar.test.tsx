import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import Navbar from '../Navbar';

describe('Navbar', () => {
  it('renders the app title', () => {
    const { getByText } = renderWithProviders(<Navbar />);
    expect(getByText('TrackMyAdventure')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    const { getByText } = renderWithProviders(<Navbar />);
    expect(getByText('Track')).toBeInTheDocument();
    expect(getByText('Activities')).toBeInTheDocument();
    expect(getByText('Friends')).toBeInTheDocument();
    expect(getByText('Profile')).toBeInTheDocument();
  });
});
