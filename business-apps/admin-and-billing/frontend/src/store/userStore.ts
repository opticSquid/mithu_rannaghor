import { createSignal } from 'solid-js';
import axios from 'axios';
import { User } from '../types';

export class TrieNode {
    children = new Map<string, TrieNode>();
    users: User[] = [];
}

export class UserTrie {
    root = new TrieNode();

    insert(user: User) {
        let node = this.root;
        const word = user.name.toLowerCase();
        for (const char of word) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNode());
            }
            node = node.children.get(char)!;
        }
        node.users.push(user);
    }

    remove(user: User) {
        let node = this.root;
        const word = user.name.toLowerCase();
        for (const char of word) {
            if (!node.children.has(char)) return;
            node = node.children.get(char)!;
        }
        node.users = node.users.filter(u => u.user_id !== user.user_id);
    }

    search(prefix: string, maxResults: number = 5): User[] {
        let node = this.root;
        const p = prefix.toLowerCase();
        for (const char of p) {
            if (!node.children.has(char)) return [];
            node = node.children.get(char)!;
        }
        
        const results: User[] = [];
        const collect = (curr: TrieNode) => {
            if (results.length >= maxResults) return;
            for (const user of curr.users) {
                if (results.length < maxResults) results.push(user);
            }
            if (results.length >= maxResults) return;
            
            for (const child of curr.children.values()) {
                collect(child);
                if (results.length >= maxResults) return;
            }
        };
        
        collect(node);
        return results;
    }
}

export const [globalUsers, setGlobalUsers] = createSignal<User[]>([]);
export const [globalUserTrie, setGlobalUserTrie] = createSignal<UserTrie>(new UserTrie());
let isLoaded = false;

export const forceRefetchUsers = async () => {
    try {
        const res = await axios.get('/api/users');
        const data = res.data || [];
        setGlobalUsers(data);
        
        const newTrie = new UserTrie();
        data.forEach((u: User) => newTrie.insert(u));
        setGlobalUserTrie(newTrie);
        isLoaded = true;
    } catch (err) {
        console.error('Failed to fetch users:', err);
    }
};

export const loadUsers = async () => {
    if (!isLoaded) {
        await forceRefetchUsers();
    }
};

export const updateUserBalance = (userId: number, newBalance: number) => {
    const updatedUsers = globalUsers().map(u => {
        if (u.user_id === userId) {
            u.balance = newBalance;
            return u;
        }
        return u;
    });
    setGlobalUsers(updatedUsers);
};

export const appendNewUser = (user: User) => {
    setGlobalUsers([...globalUsers(), user]);
    globalUserTrie().insert(user);
};

export const removeUserSurgically = (userId: number) => {
    const user = globalUsers().find(u => u.user_id === userId);
    if (user) {
        setGlobalUsers(globalUsers().filter(u => u.user_id !== userId));
        globalUserTrie().remove(user);
    }
};

export const updateUserMetadata = (oldUser: User, updatedUser: User) => {
    globalUserTrie().remove(oldUser);
    const updatedUsers = globalUsers().map(u => {
        if (u.user_id === updatedUser.user_id) {
            return updatedUser;
        }
        return u;
    });
    setGlobalUsers(updatedUsers);
    globalUserTrie().insert(updatedUser);
};
