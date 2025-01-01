<template>
	<v-footer
		app
		class="justify-space-between"
	>
		<div>
			{{ new Date().getFullYear() }} — <strong>Always On TV</strong>
		</div>
		<div>
			<v-btn
				prepend-icon="mdi-coffee"
				variant="outlined"
				size="small"
				href="https://ko-fi.com/alwaysontv"
				target="_blank"
				class="ml-5"
				color="yellow"
			>
				Support us on Ko-fi
			</v-btn>
		</div>
	</v-footer>
</template>