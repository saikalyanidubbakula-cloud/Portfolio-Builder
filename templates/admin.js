<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f4f4f4; }
        h1 { color: #333; text-align: center; }
        .logout { text-align: right; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #4682b4; color: white; }
        td a { color: #dc3545; margin-right: 10px; }
        td a:hover { text-decoration: underline; }
        .add-user-form { margin-top: 20px; }
        .add-user-form input, .add-user-form select, .add-user-form button {
            margin: 5px 0; padding: 8px; width: 200px;
        }
        .add-user-form button { background: #4682b4; color: white; border: none; border-radius: 5px; cursor: pointer; }
        .add-user-form button:hover { background: #5f9ea0; }
    </style>
</head>
<body>
    <h1>Admin Dashboard</h1>
    <div class="logout"><a href="/logout">Logout</a></div>
    <h2>Users</h2>
    <table>
        <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Admin</th>
            <th>Last Login</th>
            <th>Logged In</th>
            <th>Action</th>
        </tr>
        <% users.forEach(user => { %>
            <tr>
                <td><%= user.id %></td>
                <td><%= user.uname %></td>
                <td><%= user.email %></td>
                <td><%= user.is_admin ? 'Yes' : 'No' %></td>
                <td><%= user.last_login ? user.last_login.toLocaleString() : 'Never' %></td>
                <td><%= user.isLoggedIn ? 'Yes' : 'No' %></td>
                <td><a href="/admin/delete-user/<%= user.id %>" onclick="return confirm('Are you sure?')">Delete</a></td>
            </tr>
        <% }); %>
    </table>
    <h2>Add User</h2>
    <form class="add-user-form" action="/admin/add-user" method="post">
        <input type="text" name="uname" placeholder="Username" required>
        <input type="email" name="email" placeholder="Email" required>
        <input type="password" name="pwd" placeholder="Password" required>
        <select name="is_admin" required>
            <option value="0">Regular User</option>
            <option value="1">Admin</option>
        </select>
        <button type="submit">Add User</button>
    </form>
</body>
</html>