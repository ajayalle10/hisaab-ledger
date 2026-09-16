import { NavLink } from 'react-router-dom';
import { HomeIcon, PeopleIcon, CalendarIcon, BookIcon } from './icons';

const tabs = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/people', label: 'People', Icon: PeopleIcon, end: false },
  { to: '/calendar', label: 'Calendar', Icon: CalendarIcon, end: false },
  { to: '/book', label: 'Book', Icon: BookIcon, end: false },
];

export function BottomNav() {
  return (
    <nav className="navbar">
      {tabs.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `navitem${isActive ? ' active' : ''}`}
        >
          <Icon />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
